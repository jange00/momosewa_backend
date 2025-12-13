import { Vendor } from '../../../models/vendor.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

/**
 * Update vendor profile
 */
export const updateVendorProfile = async (req, res) => {
  try {
    const { businessName, businessAddress, storeName } = req.body;
    const updates = {};

    if (businessName) updates.businessName = businessName;
    if (businessAddress) updates.businessAddress = businessAddress;
    if (storeName) updates.storeName = storeName;

    const vendor = await Vendor.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return sendError(res, 404, 'Vendor profile not found');
    }

    return sendSuccess(res, {
      data: { vendor },
      message: 'Vendor profile updated successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update vendor profile', error.message);
  }
};


