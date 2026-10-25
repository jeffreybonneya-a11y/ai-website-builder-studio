import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  verifySessionCookie,
  verifyGoogleIdToken,
  getUserByUid,
  getActiveSessionSecret,
  User,
} from '../services/authService';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Generate a cryptographically secure, stateless CSRF token bound to the user session UID
 */
export function generateCsrfToken(uid: string): string {
  if (!uid) return '';
  const secret = getActiveSessionSecret();
  return crypto.createHmac('sha256', secret).update(`csrf:${uid}`).digest('hex');
}

/**
 * Verify CSRF token for state-changing requests using timing-safe comparison
 */
export function verifyCsrfToken(uid: string, providedToken: string): boolean {
  if (!uid || !providedToken || typeof providedToken !== 'string') return false;
  const expectedToken = generateCsrfToken(uid);

  const a = Buffer.from(expectedToken);
  const b = Buffer.from(providedToken);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Require a verified authentication token via HttpOnly cookie or Bearer header
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  let token: string | undefined;
  let isCookieToken = false;

  if (req.cookies && req.cookies.ais_session) {
    token = req.cookies.ais_session;
    isCookieToken = true;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split('Bearer ')[1];
  }

  if (!token) {
    res.status(401).json({
      error: 'Authentication required. Please sign in with Google to access this resource.',
    });
    return;
  }

  // Session cookies must be verified natively with revocation check
  let decoded = await verifySessionCookie(token, true);

  // If token is from Bearer header (not cookie), attempt Google ID token verification with revocation check
  if (!decoded && !isCookieToken) {
    decoded = await verifyGoogleIdToken(token);
  }

  if (!decoded) {
    res.status(401).json({
      error: 'Session invalid or expired. Please sign in with Google again.',
    });
    return;
  }

  let user = await getUserByUid(decoded.uid);
  if (!user) {
    user = {
      uid: decoded.uid,
      email: (decoded.email || '').toLowerCase().trim(),
      name: decoded.name || decoded.email || 'User',
      photoURL: decoded.picture || '',
      role: decoded.admin === true ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  req.user = user;
  next();
}

/**
 * CSRF Protection Middleware for state-changing requests (POST, PUT, DELETE)
 */
export function requireCsrf(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    next();
    return;
  }

  // Skip CSRF check for initial token exchange endpoint
  if (req.path === '/api/auth/google' || req.path === '/google') {
    next();
    return;
  }

  const token =
    (req.headers['x-csrf-token'] as string) ||
    (req.headers['x-xsrf-token'] as string) ||
    (req.body && req.body._csrf);

  if (!req.user || !verifyCsrfToken(req.user.uid, token)) {
    res.status(403).json({
      error: 'CSRF token validation failed. Invalid or missing security token.',
    });
    return;
  }

  next();
}

/**
 * Require Administrator privileges
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Access denied. Administrator privileges required for this action.',
    });
    return;
  }

  next();
}
