import express from 'express';
import { createPaymentOrder, verifyPayment, cashfreeWebhook, getPaymentReceipt } from '../controllers/paymentController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Public / Gateway Webhook (verifies signature inside)
router.post('/webhook', cashfreeWebhook);

// Protected Customer/Admin routes
router.post('/create-order', verifyAuth, createPaymentOrder);
router.post('/verify', verifyAuth, verifyPayment);
router.get('/receipt/:orderId', verifyAuth, getPaymentReceipt);

export default router;
