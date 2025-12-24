import { Product } from '../../models/product.js';
import { Vendor } from '../../models/vendor.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// Delete product (Vendor owner only)
export const deleteProduct = async (req, res) => {
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
      return sendError(res, 403, 'You do not have permission to delete this product');
    }

    await Product.findByIdAndDelete(req.params.id);

    return sendSuccess(res, { message: 'Product deleted successfully' });
  } catch (error) {
    return sendError(res, 500, 'Failed to delete product', error.message);
  }
};


