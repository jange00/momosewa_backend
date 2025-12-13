import { Vendor } from '../../models/vendor.js';
import { Product } from '../../models/product.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Get vendor details (public)
 */
export const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('userId', 'name email phone profilePicture')
      .select('-businessLicense -rejectedReason');

    if (!vendor) {
      return sendError(res, 404, 'Vendor not found');
    }

    // Only show active vendors publicly
    if (vendor.status !== 'active' && req.user?.role !== 'Admin') {
      return sendError(res, 404, 'Vendor not found');
    }

    return sendSuccess(res, { data: { vendor } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch vendor', error.message);
  }
};

/**
 * Get vendor's products (public)
 */
export const getVendorProducts = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor || vendor.status !== 'active') {
      return sendError(res, 404, 'Vendor not found');
    }

    const products = await Product.find({ vendorId: vendor._id, isAvailable: true })
      .sort({ createdAt: -1 })
      .limit(50);

    return sendSuccess(res, { data: { products } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch products', error.message);
  }
};


