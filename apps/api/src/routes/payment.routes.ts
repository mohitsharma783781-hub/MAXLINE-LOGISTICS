import { Router } from 'express';
import { createOrder, verifyPayment, razorpayWebhook } from '../controllers/payment.controller';

const router = Router();

// Standard Razorpay Endpoints
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);
router.post('/webhook', razorpayWebhook);

export default router;
