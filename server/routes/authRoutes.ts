import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { getAuth } from 'firebase-admin/auth';
import {
  verifyGoogleIdToken,
  createSessionCookie,
  getOrCreateUserInFirestore,
  bootstrapAdminAccount,
} from '../services/authService';
import {
  requireAuth,
  requireCsrf,
  generateCsrfToken,
  AuthenticatedRequest,
} from '../middleware/authMiddleware';

export const authRouter = Router();

// Rate limiter for authentication & Google sign-in exchanges
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts from this IP, please try again after 15 minutes.' },
});

const bootstrapLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin bootstrap attempts, please try again later.' },
});

const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax' as const,
  maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
  path: '/',
};

/**
 * Exchange Firebase Google ID Token for HttpOnly Session Cookie
 */
authRouter.post('/google', authLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { idToken } = req.body || {};

    if (!idToken || typeof idToken !== 'string') {
      res.status(400).json({ error: 'Google ID token is required.' });
      return;
    }

    const decodedToken = await verifyGoogleIdToken(idToken);
    if (!decodedToken) {
      res.status(401).json({ error: 'Invalid or unverified Google identity token.' });
      return;
    }

    // Retrieve or create persistent user profile in Firestore
    const user = await getOrCreateUserInFirestore(decodedToken);

    // Generate HttpOnly native session cookie
    let sessionCookie: string;
    try {
      sessionCookie = await createSessionCookie(idToken, 14 * 24 * 60 * 60 * 1000, decodedToken);
    } catch (cookieErr: unknown) {
      const message = cookieErr instanceof Error ? cookieErr.message : 'Session cookie creation failed';
      console.error(`[Auth Route Error] Native session-cookie creation failed: ${message}`);
      res.status(500).json({
        error: 'Authentication failure: Unable to issue native session cookie. Server credentials or configuration may be required.',
      });
      return;
    }

    // Set HttpOnly cookie
    res.cookie('ais_session', sessionCookie, COOKIE_OPTIONS);

    // Generate session CSRF token
    const csrfToken = generateCsrfToken(user.uid);

    res.status(200).json({
      message: 'Signed in with Google successfully.',
      user,
      csrfToken,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Google authentication failed.';
    res.status(400).json({ error: message });
  }
});

/**
 * Sign out (Protected by Auth & CSRF)
 */
authRouter.post('/logout', requireAuth, requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.uid) {
    try {
      await getAuth().revokeRefreshTokens(req.user.uid);
    } catch {
      // Ignore token revocation errors if in mock/test environment
    }
  }

  res.clearCookie('ais_session', { path: '/' });
  res.status(200).json({ message: 'Signed out successfully.' });
});

/**
 * Get current authenticated user & issue CSRF token for state-changing requests
 */
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const csrfToken = generateCsrfToken(user.uid);

  res.status(200).json({
    user,
    isAuthenticated: true,
    csrfToken,
  });
});

/**
 * One-Time Server-Controlled Administrator Bootstrap
 * Requires explicit ADMIN_BOOTSTRAP_KEY, authenticated user, and designated email match.
 */
authRouter.post(
  '/bootstrap-admin',
  bootstrapLimiter,
  requireAuth,
  requireCsrf,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const bootstrapKey = (req.headers['x-admin-bootstrap-key'] as string) || req.body?.bootstrapKey;

      if (!bootstrapKey) {
        res.status(400).json({ error: 'Administrator bootstrap key is required.' });
        return;
      }

      const updatedUser = await bootstrapAdminAccount(req.user!.uid, bootstrapKey, req.user!.email);

      res.status(200).json({
        message: 'Administrator role successfully provisioned.',
        user: updatedUser,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Admin bootstrap failed.';
      res.status(403).json({ error: message });
    }
  }
);
