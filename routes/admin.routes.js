import express from 'express';
import { getDashboardStats } from '../controller/admin/dashboard.controller.js';
import { getVendors } from '../controller/admin/vendor/get.controller.js';
import { getPendingVendors } from '../controller/admin/vendor/getPending.controller.js';
import { getVendorDetails } from '../controller/admin/vendor/getById.controller.js';
import { approveVendor } from '../controller/admin/vendor/approve.controller.js';
import { rejectVendor } from '../controller/admin/vendor/reject.controller.js';
import { suspendVendor } from '../controller/admin/vendor/suspend.controller.js';
import { getUsers } from '../controller/admin/user/get.controller.js';
import { getUserDetails } from '../controller/admin/user/getById.controller.js';
import { updateUser } from '../controller/admin/user/update.controller.js';
import { deleteUser } from '../controller/admin/user/delete.controller.js';
import { getAllOrders } from '../controller/admin/order/get.controller.js';
import { getOrderDetails } from '../controller/admin/order/getById.controller.js';
import { adminOnly } from '../middlewares/auth.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminOnly);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Vendor management
router.get('/vendors', getVendors);
router.get('/vendors/pending', getPendingVendors);
router.get('/vendors/:id', getVendorDetails);
router.put('/vendors/:id/approve', approveVendor);
router.put(
  '/vendors/:id/reject',
  [body('reason').trim().notEmpty().withMessage('Rejection reason is required')],
  validate,
  rejectVendor
);
router.put('/vendors/:id/suspend', suspendVendor);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put(
  '/users/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional().trim().notEmpty(),
    body('role').optional().isIn(['Customer', 'Vendor', 'Admin']),
  ],
  validate,
  updateUser
);
router.delete('/users/:id', deleteUser);

// Order management
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderDetails);

export default router;
