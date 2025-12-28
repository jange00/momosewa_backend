import { Product } from '../../models/product.js';
import { Vendor } from '../../models/vendor.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { isValidSubcategory } from '../../utils/productSubcategories.js';

// Update product (Vendor owner only)
export const updateProduct = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });

    if (!vendor) {
      return sendError(res, 404, 'Vendor profile not found');
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    if (product.vendorId.toString() !== vendor._id.toString()) {
      return sendError(res, 403, 'You do not have permission to update this product');
    }

    // Get the category that will be used (from body or existing)
    const newCategory = req.body.category || product.category;
    const newSubcategory = req.body.subcategory;

    // If subcategory is provided and category exists, validate it
    if (newSubcategory && newCategory) {
      if (!isValidSubcategory(newCategory, newSubcategory)) {
        return sendError(res, 400, `Invalid subcategory for category "${newCategory}"`);
      }
    }

    // If category is being changed but subcategory is not updated,
    // clear the subcategory if it's no longer valid
    if (req.body.category && req.body.category !== product.category && !newSubcategory) {
      if (product.subcategory && !isValidSubcategory(req.body.category, product.subcategory)) {
        product.subcategory = null; // Clear invalid subcategory
      }
    }

    Object.assign(product, req.body);
    await product.save();

    return sendSuccess(res, {
      data: { product },
      message: 'Product updated successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update product', error.message);
  }
};


