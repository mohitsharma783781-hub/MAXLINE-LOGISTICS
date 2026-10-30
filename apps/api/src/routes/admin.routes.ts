import { Router } from 'express';
import { authenticateToken, requirePlatformAdmin } from '../middleware/auth.middleware';
import {
  getDashboardStats,
  getMerchants,
  updateMerchantStatus,
  getWallets,
  adjustWallet,
} from '../controllers/admin.controller';

const router = Router();

// Platform Admin Verification Check
router.get('/verify', authenticateToken, requirePlatformAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Platform administrator credentials verified.',
    data: {
      isVerifiedAdmin: true,
      user: {
        userId: req.user?.userId,
        email: req.user?.email,
        role: req.user?.role,
        isPlatformAdmin: req.user?.isPlatformAdmin ?? true,
      },
    },
  });
});

// Platform Operational Metrics & Management
router.get('/dashboard-stats', authenticateToken, requirePlatformAdmin, getDashboardStats);
router.get('/merchants', authenticateToken, requirePlatformAdmin, getMerchants);
router.put('/merchants/:id/status', authenticateToken, requirePlatformAdmin, updateMerchantStatus);
router.get('/wallets', authenticateToken, requirePlatformAdmin, getWallets);
router.post('/wallets/adjust', authenticateToken, requirePlatformAdmin, adjustWallet);

export default router;
