import { Product } from '../../models/product.js';
import { Vendor } from '../../models/vendor.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { uploadToCloudinary } from '../../middlewares/upload.middleware.js';

// Create product (Vendor only)
export const createProduct = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });

    if (!vendor) {
      return sendError(res, 404, 'Vendor profile not found');
    }

    if (vendor.status !== 'active' || !vendor.isActive) {
      return sendError(res, 403, 'Vendor account is not active');
    }

    const productData = {
      ...req.body,
      vendorId: vendor._id,
    };

    // Handle image upload (same logic as profile picture)
    if (req.file) {
      const imageUrl = await uploadToCloudinary(req.file);
      productData.image = imageUrl;
      productData.images = [imageUrl]; // Also add to images array
    }

    const product = await Product.create(productData);

    return sendSuccess(res, {
      data: { product },
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('Product creation error:', error);
    return sendError(res, 500, 'Failed to create product', error.message);
  }
};


