import { VendorApplication } from '../../../models/vendorApplication.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

/**
 * Get pending vendor applications
 */
export const getPendingVendors = async (req, res) => {
  try {
    const applications = await VendorApplication.find({ status: 'pending' })
      .populate('userId', 'name email phone')
      .sort({ applicationDate: -1 });

    return sendSuccess(res, { data: { applications } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch pending vendor applications', error.message);
  }
};


