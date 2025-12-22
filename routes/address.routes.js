import express from 'express';
import { getAddresses } from '../controller/address/get.controller.js';
import { addAddress } from '../controller/address/create.controller.js';
import { updateAddress } from '../controller/address/update.controller.js';
import { deleteAddress } from '../controller/address/delete.controller.js';
import { setDefaultAddress } from '../controller/address/setDefault.controller.js';
import { getAreasByCity } from '../controller/address/getAreas.controller.js';
import { authenticate, customerOnly } from '../middlewares/auth.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

router.use(authenticate);
router.use(customerOnly);

router.get('/', getAddresses);
router.get('/areas/:city', getAreasByCity);
router.post(
  '/',
  [
    body('label').trim().notEmpty().withMessage('Address label is required'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('city')
      .trim()
      .notEmpty()
      .withMessage('City is required')
      .isIn(['Kathmandu', 'Bhaktapur', 'Lalitpur', 'Kritipur'])
      .withMessage('City must be one of: Kathmandu, Bhaktapur, Lalitpur, Kritipur'),
    body('area').trim().notEmpty().withMessage('Area is required'),
    body('nearestLandmark').trim().notEmpty().withMessage('Nearest landmark is required'),
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
    body('city')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('City cannot be empty')
      .isIn(['Kathmandu', 'Bhaktapur', 'Lalitpur', 'Kritipur'])
      .withMessage('City must be one of: Kathmandu, Bhaktapur, Lalitpur, Kritipur'),
    body('area').optional().trim().notEmpty(),
    body('nearestLandmark').optional().trim().notEmpty(),
  ],
  validate,
  updateAddress
);
router.delete('/:id', deleteAddress);
router.put('/:id/default', setDefaultAddress);

export default router;
