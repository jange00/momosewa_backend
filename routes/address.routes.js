import express from 'express';
import { getAddresses } from '../controller/address/get.controller.js';
import { addAddress } from '../controller/address/create.controller.js';
import { updateAddress } from '../controller/address/update.controller.js';
import { deleteAddress } from '../controller/address/delete.controller.js';
import { setDefaultAddress } from '../controller/address/setDefault.controller.js';
import { authenticate, customerOnly } from '../middlewares/auth.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

router.use(authenticate);
router.use(customerOnly);

router.get('/', getAddresses);
router.post(
  '/',
  [
    body('label').trim().notEmpty().withMessage('Address label is required'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('area').trim().notEmpty().withMessage('Area is required'),
  ],
  validate,
  addAddress
);
router.put(
  '/:id',
  [
    body('label').optional().trim().notEmpty(),
    body('fullName').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('address').optional().trim().notEmpty(),
    body('city').optional().trim().notEmpty(),
    body('area').optional().trim().notEmpty(),
  ],
  validate,
  updateAddress
);
router.delete('/:id', deleteAddress);
router.put('/:id/default', setDefaultAddress);

export default router;
