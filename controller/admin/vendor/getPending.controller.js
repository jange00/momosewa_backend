import { VendorApplication } from '../../../models/vendorApplication.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

/**
 * Get pending vendor applications
 */
export const getPendingVendors = async (req, res) => {
  try {
    // Applications now store name, email, phone directly (no need to populate userId)
    const applications = await VendorApplication.find({ status: 'pending' })
      .select('-password') // Don't send password to admin
      .populate('reviewedBy', 'name email') // Populate reviewer if exists
      .sort({ applicationDate: -1 });

    return sendSuccess(res, { data: { applications } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch pending vendor applications', error.message);
  }
};


