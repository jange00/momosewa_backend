import { Address } from '../../models/address.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Update address
 */
export const updateAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return sendError(res, 404, 'Address not found');
    }

    if (address.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    Object.assign(address, req.body);
    await address.save();

    return sendSuccess(res, {
      data: { address },
      message: 'Address updated successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update address', error.message);
  }
};


