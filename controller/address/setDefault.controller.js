import { Address } from '../../models/address.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Set as default address
 */
export const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return sendError(res, 404, 'Address not found');
    }

    if (address.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    address.isDefault = true;
    await address.save();

    return sendSuccess(res, {
      data: { address },
      message: 'Default address updated successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to set default address', error.message);
  }
};


