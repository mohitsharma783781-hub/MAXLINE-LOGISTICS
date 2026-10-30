import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller';

const router = Router();

// Standard Razorpay Endpoints
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

export default router;
