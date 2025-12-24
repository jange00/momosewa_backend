import { Address } from '../../models/address.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// Add new address
export const addAddress = async (req, res) => {
  try {
    const addressData = {
      ...req.body,
      userId: req.user._id,
    };

    const address = await Address.create(addressData);
    return sendSuccess(res, {
      data: { address },
      message: 'Address added successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to add address', error.message);
  }
};


