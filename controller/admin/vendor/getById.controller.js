import { Vendor } from '../../../models/vendor.js';
import { VendorApplication } from '../../../models/vendorApplication.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

/**
 * Get vendor details (can be application or approved vendor)
 */
export const getVendorDetails = async (req, res) => {
  try {
    // First try to find as approved vendor
    const vendor = await Vendor.findById(req.params.id)
      .populate('userId', 'name email phone profilePicture')
      .populate('approvedBy', 'name email');

    if (vendor) {
      return sendSuccess(res, { data: { vendor, type: 'vendor' } });
    }

    // If not found, try as application
    const application = await VendorApplication.findById(req.params.id)
      .select('-password') // Don't send password
      .populate('userId', 'name email phone profilePicture') // userId may be null for pending apps
      .populate('reviewedBy', 'name email');

    if (!application) {
      return sendError(res, 404, 'Vendor or application not found');
    }

    return sendSuccess(res, { data: { application, type: 'application' } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch vendor', error.message);
  }
};


