import express from 'express';
import {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  getTransactions,
  initiateEsewaPayment,
  esewaWebhook,
  verifyEsewaPayment,
  esewaSuccess,
  esewaFailure,
} from '../controller/payment.controller.js';
import { authenticate, customerOnly } from '../middlewares/auth.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

// Khalti payment routes
router.post(
  '/khalti/initiate',
  authenticate,
  customerOnly,
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  ],
  validate,
  initiateKhaltiPayment
);

router.post(
  '/khalti/verify',
  authenticate,
  [body('pidx').notEmpty().withMessage('Payment ID is required')],
  validate,
  verifyKhaltiPayment
);

// eSewa payment routes
router.post(
  '/esewa/initiate',
  authenticate,
  customerOnly,
  [body('orderId').notEmpty().withMessage('Order ID is required')],
  validate,
  initiateEsewaPayment
);

router.post('/esewa/webhook', esewaWebhook); // Public endpoint for eSewa callback
router.get('/esewa/verify/:transactionId', authenticate, verifyEsewaPayment);
router.get('/esewa/success', esewaSuccess); // Public redirect handler
router.get('/esewa/failure', esewaFailure); // Public redirect handler

// Common routes
router.get('/transactions', authenticate, customerOnly, getTransactions);

export default router;


