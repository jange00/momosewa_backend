import { Vendor } from '../../../models/vendor.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

// Get vendor profile (authenticated vendor)
export const getVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone profilePicture')
      .populate('approvedBy', 'name email');

    if (!vendor) {
      return sendError(res, 404, 'Vendor profile not found');
    }

    return sendSuccess(res, { data: { vendor } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch vendor profile', error.message);
  }
};


