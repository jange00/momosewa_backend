import express from 'express';
import {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from '../controller/review.controller.js';
import { authenticate, customerOnly, adminOnly } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

// Public routes
router.get('/', getReviews);
router.get('/:id', getReviewById);

// Customer routes
router.post(
  '/',
  authenticate,
  customerOnly,
  upload.array('images', 5),
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim(),
    body('productId').optional(),
  ],
  validate,
  createReview
);

router.put(
  '/:id',
  authenticate,
  [
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('comment').optional().trim(),
  ],
  validate,
  updateReview
);

router.delete('/:id', authenticate, deleteReview);

export default router;


