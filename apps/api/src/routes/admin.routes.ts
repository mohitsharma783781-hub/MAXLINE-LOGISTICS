import { Router, Request, Response } from 'express';
import { authenticateToken, requirePlatformAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * Server-side verification endpoint for Platform Admin credentials.
 * GET /api/v1/admin/verify
 * Requires valid Bearer JWT and verified SUPER_ADMIN or ADMIN_OPERATOR role.
 */
router.get('/verify', authenticateToken, requirePlatformAdmin, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Platform administrator credentials verified.',
    data: {
      isVerifiedAdmin: true,
      user: {
        userId: req.user?.userId,
        email: req.user?.email,
        role: req.user?.role,
        isPlatformAdmin: req.user?.isPlatformAdmin ?? true
      }
    }
  });
});

export default router;
