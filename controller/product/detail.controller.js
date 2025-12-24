import { Product } from '../../models/product.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// Get product details
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('vendorId', 'storeName businessName');

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    return sendSuccess(res, { data: { product } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch product', error.message);
  }
};


