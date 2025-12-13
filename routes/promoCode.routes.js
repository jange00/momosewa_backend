import express from 'express';
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  validatePromo,
} from '../controller/promoCode.controller.js';
import { adminOnly } from '../middlewares/auth.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

// Public routes
router.get('/', getPromoCodes);
router.post(
  '/validate',
  [
    body('code').trim().notEmpty().withMessage('Promo code is required'),
    body('orderTotal').isFloat({ min: 0 }).withMessage('Valid order total is required'),
  ],
  validate,
  validatePromo
);

// Admin routes
router.post(
  '/',
  adminOnly,
  [
    body('code').trim().notEmpty().withMessage('Promo code is required'),
    body('discountType').isIn(['percentage', 'fixed']).withMessage('Valid discount type is required'),
    body('discountValue').isFloat({ min: 0 }).withMessage('Valid discount value is required'),
    body('validFrom').isISO8601().withMessage('Valid from date is required'),
    body('validUntil').isISO8601().withMessage('Valid until date is required'),
  ],
  validate,
  createPromoCode
);

router.put(
  '/:id',
  adminOnly,
  [
    body('code').optional().trim().notEmpty(),
    body('discountType').optional().isIn(['percentage', 'fixed']),
    body('discountValue').optional().isFloat({ min: 0 }),
  ],
  validate,
  updatePromoCode
);

router.delete('/:id', adminOnly, deletePromoCode);

export default router;


