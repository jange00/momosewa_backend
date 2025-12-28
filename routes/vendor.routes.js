import express from 'express';
import { getApprovalStatus } from '../controller/vendor/profile/getApprovalStatus.controller.js';
import { getVendorProfile } from '../controller/vendor/profile/get.controller.js';
import { updateVendorProfile } from '../controller/vendor/profile/update.controller.js';
import { getVendorById, getVendorProducts } from '../controller/vendor/public.controller.js';
import { authenticate, vendorOwner } from '../middlewares/auth.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

// Vendor-specific routes (require authentication)
router.get('/pending-approval', authenticate, getApprovalStatus);
router.get('/profile', authenticate, vendorOwner, getVendorProfile);
router.put(
  '/profile',
  authenticate,
  vendorOwner,
  [
    body('businessName').optional().trim().notEmpty(),
    body('businessAddress').optional().trim().notEmpty(),
    body('storeName').optional().trim().notEmpty(),
  ],
  validate,
  updateVendorProfile
);

// Public routes
router.get('/:id', getVendorById);
router.get('/:id/products', getVendorProducts);

export default router;
