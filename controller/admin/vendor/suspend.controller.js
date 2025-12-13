import { Vendor } from '../../../models/vendor.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

/**
 * Suspend active vendor
 */
export const suspendVendor = async (req, res) => {
  try {
    const { reason } = req.body;

    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return sendError(res, 404, 'Vendor not found');
    }

    vendor.status = 'suspended';
    vendor.isActive = false;
    await vendor.save();

    return sendSuccess(res, {
      data: { vendor },
      message: 'Vendor suspended successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to suspend vendor', error.message);
  }
};


