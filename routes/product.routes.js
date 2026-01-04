import express from 'express';
import { getProducts } from '../controller/product/list.controller.js';
import { getProductById } from '../controller/product/detail.controller.js';
import { getProductsBySubcategory } from '../controller/product/getBySubcategory.controller.js';
import { createProduct } from '../controller/product/create.controller.js';
import { updateProduct } from '../controller/product/update.controller.js';
import { deleteProduct } from '../controller/product/delete.controller.js';
import { uploadProductImages } from '../controller/product/image.controller.js';
import { authenticate, vendorActive } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/subcategories/:subcategory', getProductsBySubcategory);
router.get('/:id', getProductById);

// Vendor routes
router.post(
  '/',
  authenticate,
  vendorActive,
  upload.single('image'), // Handle FormData with optional image
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').toFloat().isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('category').isIn(['Steamed', 'Fried', 'Special', 'Combo']).withMessage('Valid category is required'),
    body('subcategory').isIn(['veg', 'chicken', 'buff', 'pork', 'mutton', 'seafood']).withMessage('Valid subcategory is required'),
  ],
  validate,
  createProduct
);

router.put(
  '/:id',
  authenticate,
  vendorActive,
  [
    body('name').optional().trim().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('category').optional().isIn(['Steamed', 'Fried', 'Special', 'Combo']),
    body('subcategory').optional().isIn(['veg', 'chicken', 'buff', 'pork', 'mutton', 'seafood']),
  ],
  validate,
  updateProduct
);

router.delete('/:id', authenticate, vendorActive, deleteProduct);
router.post('/:id/images', authenticate, vendorActive, upload.array('images', 5), uploadProductImages);

export default router;
