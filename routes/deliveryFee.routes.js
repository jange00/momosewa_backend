import express from 'express';
import { getDeliveryFee } from '../controller/deliveryFee/get.controller.js';
import { query } from 'express-validator';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

// Get delivery fee (public endpoint, no auth required)
router.get(
  '/',
  [
    query('orderTotal')
      .notEmpty()
      .withMessage('Order total is required')
      .customSanitizer((value) => {
        return typeof value === 'string' ? parseFloat(value) : value;
      })
      .isFloat({ min: 0 })
      .withMessage('Valid order total is required (must be a number >= 0)'),
  ],
  validate,
  getDeliveryFee
);

export default router;





