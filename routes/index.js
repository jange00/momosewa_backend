import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import vendorRoutes from './vendor.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import cartRoutes from './cart.routes.js';
import addressRoutes from './address.routes.js';
import reviewRoutes from './review.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';
import paymentRoutes from './payment.routes.js';
import promoCodeRoutes from './promoCode.routes.js';
import deliveryFeeRoutes from './deliveryFee.routes.js';

const router = express.Router();

// Route modules - all routes are under /api/v1
router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/vendors', vendorRoutes);
router.use('/v1/products', productRoutes);
router.use('/v1/orders', orderRoutes);
router.use('/v1/cart', cartRoutes);
router.use('/v1/addresses', addressRoutes);
router.use('/v1/reviews', reviewRoutes);
router.use('/v1/notifications', notificationRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/payments', paymentRoutes);
router.use('/v1/promo-codes', promoCodeRoutes);
router.use('/v1/delivery-fee', deliveryFeeRoutes);

export default router;
