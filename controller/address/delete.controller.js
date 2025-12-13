import { Address } from '../../models/address.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Delete address
 */
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return sendError(res, 404, 'Address not found');
    }

    if (address.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    await Address.findByIdAndDelete(req.params.id);

    return sendSuccess(res, { message: 'Address deleted successfully' });
  } catch (error) {
    return sendError(res, 500, 'Failed to delete address', error.message);
  }
};


