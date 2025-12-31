import { getDeliveryFeeSettingsForAPI } from '../../utils/calculateDeliveryFee.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// Get delivery fee settings (public endpoint)
export const getDeliveryFeeSettings = async (req, res) => {
  try {
    const settings = await getDeliveryFeeSettingsForAPI();
    
    return sendSuccess(res, {
      data: { settings },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch delivery fee settings', error.message);
  }
};

