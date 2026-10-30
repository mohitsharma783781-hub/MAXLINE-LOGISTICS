import { Router } from 'express';
import { registerHandler, loginHandler, meHandler } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public auth endpoints protected with rate limiting
router.post('/register', authRateLimiter, registerHandler);
router.post('/login', authRateLimiter, loginHandler);

// Authenticated user profile endpoint
router.get('/me', authenticateToken, meHandler);

export default router;
