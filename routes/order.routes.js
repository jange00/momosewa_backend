import express from 'express';
import { createOrder } from '../controller/order/create.controller.js';
import { getOrders } from '../controller/order/list.controller.js';
import { getOrderById } from '../controller/order/detail.controller.js';
import { updateOrderStatus } from '../controller/order/status.controller.js';
import { cancelOrder } from '../controller/order/cancel.controller.js';
import { trackOrder } from '../controller/order/tracking.controller.js';
import { authenticate, vendorActive, adminOnly } from '../middlewares/auth.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  [
    body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
    body('deliveryAddress').isObject().withMessage('Delivery address is required'),
    body('paymentMethod').isIn(['khalti', 'cash-on-delivery']).withMessage('Valid payment method is required'),
    body('promoCode').optional().trim(),
  ],
  validate,
  createOrder
);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.get('/:id/track', trackOrder);

router.put(
  '/:id/status',
  [body('status').isIn(['pending', 'preparing', 'on-the-way', 'delivered', 'cancelled'])],
  validate,
  updateOrderStatus
);

router.put(
  '/:id/cancel',
  [body('reason').optional().trim()],
  validate,
  cancelOrder
);

export default router;
