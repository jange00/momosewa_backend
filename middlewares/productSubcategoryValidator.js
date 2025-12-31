import { body } from 'express-validator';
import { isValidSubcategory, getSubcategoriesByCategory } from '../utils/productSubcategories.js';

/**
 * Custom validator for product subcategory
 * Validates that subcategory is valid for the selected category
 */
export const validateSubcategory = () => {
  return body('subcategory')
    .optional()
    .trim()
    .custom((value, { req }) => {
      // If subcategory is provided, category must also be provided (or exist in body)
      const category = req.body.category;
      
      if (!value) {
        // Subcategory is optional, so empty is fine
        return true;
      }
      
      if (!category) {
        throw new Error('Category is required when subcategory is provided');
      }
      
      // Validate subcategory against category
      if (!isValidSubcategory(category, value)) {
        const allowedSubcategories = getSubcategoriesByCategory(category);
        throw new Error(
          `Invalid subcategory for category "${category}". Allowed subcategories: ${allowedSubcategories.join(', ')}`
        );
      }
      
      return true;
    });
};

/**
 * Validator for updating subcategory when category might be changing
 * This handles the case where both category and subcategory are being updated
 */
export const validateSubcategoryForUpdate = () => {
  return body('subcategory')
    .optional()
    .trim()
    .custom(async (value, { req }) => {
      if (!value) {
        // Subcategory is optional
        return true;
      }
      
      // Get category from body (if being updated) or from existing product
      let category = req.body.category;
      
      // If category is not in body, we need to check existing product
      if (!category && req.params && req.params.id) {
        try {
          const { Product } = await import('../models/product.js');
          const product = await Product.findById(req.params.id);
          if (product) {
            category = product.category;
          }
        } catch (error) {
          // Product not found or other error - will be handled by update controller
        }
      }
      
      if (!category) {
        throw new Error('Category must be specified when setting subcategory');
      }
      
      if (!isValidSubcategory(category, value)) {
        const allowedSubcategories = getSubcategoriesByCategory(category);
        throw new Error(
          `Invalid subcategory for category "${category}". Allowed subcategories: ${allowedSubcategories.join(', ')}`
        );
      }
      
      return true;
    });
};




