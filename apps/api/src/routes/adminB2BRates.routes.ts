import { Router } from 'express';
import {
  listB2BRateCards,
  getB2BRateCardById,
  createB2BRateCard,
  updateB2BRateCard,
  toggleB2BRateCardStatus,
  deleteB2BRateCard,
  getB2BRateCardAuditLogs,
  calculateB2BRate,
  bulkImportDraftRateCards,
  activateRateCard,
  rollbackRateCard,
  updateMerchantMarkup,
  compareB2BRates,
  validateB2BQuote,
  consumeB2BQuote,
} from '../controllers/adminB2BRates.controller';
import { authenticateToken, requirePlatformAdmin } from '../middleware/auth.middleware';

const router = Router();

// Pricing Calculation & Comparison (accessible by authenticated users, e.g. sellers & admins)
router.post('/calculate', authenticateToken, calculateB2BRate);
router.post('/compare', authenticateToken, compareB2BRates);
router.post('/validate-quote', authenticateToken, validateB2BQuote);
router.post('/consume-quote', authenticateToken, consumeB2BQuote);

// Administrative CRUD operations — strictly require verified Platform Admin privileges
router.get('/', authenticateToken, requirePlatformAdmin, listB2BRateCards);
router.post('/', authenticateToken, requirePlatformAdmin, createB2BRateCard);
router.post('/bulk-import', authenticateToken, requirePlatformAdmin, bulkImportDraftRateCards);
router.get('/:id', authenticateToken, requirePlatformAdmin, getB2BRateCardById);
router.put('/:id', authenticateToken, requirePlatformAdmin, updateB2BRateCard);
router.patch('/:id/status', authenticateToken, requirePlatformAdmin, toggleB2BRateCardStatus);
router.patch('/:id/activate', authenticateToken, requirePlatformAdmin, activateRateCard);
router.post('/:id/rollback', authenticateToken, requirePlatformAdmin, rollbackRateCard);
router.patch('/:id/markup', authenticateToken, requirePlatformAdmin, updateMerchantMarkup);
router.delete('/:id', authenticateToken, requirePlatformAdmin, deleteB2BRateCard);
router.get('/:id/audit-logs', authenticateToken, requirePlatformAdmin, getB2BRateCardAuditLogs);

export default router;
