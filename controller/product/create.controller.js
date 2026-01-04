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

    // Handle image upload if present
    let imageUrl = null;
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file);
      } catch (uploadError) {
        return sendError(res, 500, 'Failed to upload image', uploadError.message);
      }
    }

    // Parse numeric fields from FormData (they come as strings)
    const productData = {
      name: req.body.name,
      description: req.body.description || '',
      price: parseFloat(req.body.price),
      originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : null,
      category: req.body.category,
      subcategory: req.body.subcategory,
      stock: req.body.stock ? parseInt(req.body.stock) : -1,
      isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable === 'true' || req.body.isAvailable === true : true,
      emoji: req.body.emoji || '🥟',
      image: imageUrl,
      vendorId: vendor._id,
    };

    const product = await Product.create(productData);

    return sendSuccess(res, {
      data: { product },
      message: 'Product created successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to create product', error.message);
  }
};


