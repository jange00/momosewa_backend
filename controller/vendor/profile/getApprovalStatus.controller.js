import { Vendor } from '../../../models/vendor.js';
import { VendorApplication } from '../../../models/vendorApplication.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

// Get vendor approval status
export const getApprovalStatus = async (req, res) => {
  try {
    // Check if vendor is already approved (has Vendor document)
    const vendor = await Vendor.findOne({ userId: req.user._id }).populate('approvedBy', 'name email');

    if (vendor) {
      return sendSuccess(res, { 
        data: { 
          vendor,
          application: null,
          isApproved: true 
        } 
      });
    }

    // Check if there's a pending/rejected application
    const application = await VendorApplication.findOne({ userId: req.user._id })
      .populate('reviewedBy', 'name email');

    if (!application) {
      return sendError(res, 404, 'No vendor application found');
    }

    return sendSuccess(res, { 
      data: { 
        application,
        vendor: null,
        isApproved: false 
      } 
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch approval status', error.message);
  }
};


