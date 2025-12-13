import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyPromoCode,
} from '../controller/cart.controller.js';
import { authenticate, customerOnly } from '../middlewares/auth.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(customerOnly);

router.get('/', getCart);
router.post(
  '/',
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').optional().isInt({ min: 1 }),
    body('variant').optional().trim(),
  ],
  validate,
  addToCart
);
router.put(
  '/:itemId',
  [body('quantity').isInt({ min: 1 }).withMessage('Valid quantity is required')],
  validate,
  updateCartItem
);
router.delete('/:itemId', removeFromCart);
router.delete('/', clearCart);
router.post(
  '/apply-promo',
  [body('promoCode').trim().notEmpty().withMessage('Promo code is required')],
  validate,
  applyPromoCode
);

export default router;


