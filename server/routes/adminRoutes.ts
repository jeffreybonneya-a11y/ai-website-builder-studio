import { Router, Response } from 'express';
import { requireAdmin, AuthenticatedRequest } from '../middleware/authMiddleware';

export const adminRouter = Router();

/**
 * Verified Administrator Authorization Status Endpoint
 * Strictly protected by requireAdmin middleware.
 * Verifies that the session token is genuine and that the user's role is 'admin'
 * matching the designated sole administrator identity.
 */
adminRouter.get('/verify', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    status: 'authorized',
    role: req.user?.role,
    administrator: req.user?.email,
    timestamp: new Date().toISOString(),
    message: 'Server-side administrator authorization verified.',
  });
});
