import express from 'express';
import {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  getTransactions,
} from '../controller/payment.controller.js';
import { authenticate, customerOnly } from '../middlewares/auth.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

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

router.get('/transactions', authenticate, customerOnly, getTransactions);

export default router;


