import { Product } from '../../models/product.js';
import { Vendor } from '../../models/vendor.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { uploadMultipleToCloudinary } from '../../middlewares/upload.middleware.js';

// Upload product images
export const uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, 'At least one image is required');
    }

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

    const imageUrls = await uploadMultipleToCloudinary(req.files, 'momosewa/products');

    if (product.images.length === 0 && imageUrls.length > 0) {
      product.image = imageUrls[0];
    }

    product.images = [...product.images, ...imageUrls];
    await product.save();

    return sendSuccess(res, {
      data: { images: product.images },
      message: 'Images uploaded successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to upload images', error.message);
  }
};


