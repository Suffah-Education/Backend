import express from 'express';
import { protect } from '../middleware/protect.js';
import { createOrder, verifyPayment } from '../controllers/payment.controller.js';


const router = express.Router();

router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);

export default router;