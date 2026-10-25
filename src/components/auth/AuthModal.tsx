import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { loginWithGoogle, loading, error, clearError } = useAuth();

  const handleGoogleSignIn = async () => {
    clearError();
    const success = await loginWithGoogle();
    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B0B0B]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#141414] border border-[#303030] rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#303030] bg-[#0E0E10]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#E5484D] text-xl">shield</span>
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-wide">
              Sign In to Studio
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#1B1B1B] transition-colors"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Subheader */}
          <div className="text-center space-y-1">
            <h3 className="text-base font-display font-semibold text-white">
              Welcome to AI Website Builder Studio
            </h3>
            <p className="text-xs text-[#B0B0B0] font-body">
              Authentication is unified under verified Google identity.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-[#690005]/40 border border-[#FF5357]/40 text-xs text-white flex items-start gap-2">
              <span className="material-symbols-outlined text-[#FF5357] text-sm shrink-0 mt-0.5">
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* Single Google Sign-In Action */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-display font-bold transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 shadow-lg active:scale-[0.99]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Platform Notice */}
          <div className="p-3.5 rounded-xl bg-[#1B1B1B] border border-[#303030] space-y-2">
            <div className="flex items-center gap-1.5 text-[#B0B0B0] text-xs font-display font-semibold">
              <span className="material-symbols-outlined text-sm text-[#E5484D]">lock</span>
              <span>Secure Authentication & Access Control</span>
            </div>
            <p className="text-[11px] text-[#8E8E8E] font-body leading-relaxed">
              Google Sign-In is the sole identity provider. Accounts created on first sign-in receive standard user access. Administrator authorization (`jeffreybonneya@gmail.com`) requires verified Google identity and explicit server-side bootstrap key validation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
