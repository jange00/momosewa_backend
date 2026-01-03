import { Address } from '../../models/address.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Get user's saved addresses
 */
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    return sendSuccess(res, { data: { addresses } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch addresses', error.message);
  }
};


