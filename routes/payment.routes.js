import express from 'express';
import {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  getTransactions,
  initiateEsewaPayment,
  verifyEsewaPayment,
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

// Esewa payment routes
router.post(
  '/esewa/initiate',
  authenticate,
  customerOnly,
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .customSanitizer((value) => {
        // Convert string to number if needed
        if (value === null || value === undefined || value === '') {
          return value;
        }
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(numValue) ? value : numValue;
      })
      .isFloat({ min: 0 })
      .withMessage('Valid amount is required (must be a number >= 0)'),
  ],
  validate,
  initiateEsewaPayment
);

router.post(
  '/esewa/verify',
  authenticate,
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .customSanitizer((value) => {
        // Convert string to number if needed
        if (value === null || value === undefined || value === '') {
          return value;
        }
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(numValue) ? value : numValue;
      })
      .isFloat({ min: 0 })
      .withMessage('Valid amount is required (must be a number >= 0)'),
    body('refId').notEmpty().withMessage('Reference ID is required'),
  ],
  validate,
  verifyEsewaPayment
);

export default router;


