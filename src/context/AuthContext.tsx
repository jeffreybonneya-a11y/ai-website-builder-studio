import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  csrfToken: string | null;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate session on page boot & retrieve CSRF token
  useEffect(() => {
    fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          if (data.csrfToken) {
            setCsrfToken(data.csrfToken);
          }
        }
      })
      .catch(() => {
        setUser(null);
        setCsrfToken(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const loginWithGoogle = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // 1. Trigger Firebase Client SDK Popup Google Authentication
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // 2. Exchange Google ID Token for HttpOnly Session Cookie on Express backend
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      setUser(data.user);
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
      }

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      await fetch('/api/auth/logout', {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      await signOut(auth);
    } catch {
      // Ignore network errors on sign out
    } finally {
      setUser(null);
      setCsrfToken(null);
    }
  };

  const clearError = () => setError(null);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        loading,
        error,
        csrfToken,
        loginWithGoogle,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
