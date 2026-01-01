import { AdminSettings } from '../../../models/adminSettings.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

// Get delivery fee settings
export const getDeliveryFeeSettings = async (req, res) => {
  try {
    const [thresholdSetting, feeSetting] = await Promise.all([
      AdminSettings.findOne({ key: 'delivery_free_threshold' }),
      AdminSettings.findOne({ key: 'delivery_fee' }),
    ]);

    const settings = {
      freeDeliveryThreshold: thresholdSetting?.value || 500,
      deliveryFee: feeSetting?.value || 50,
    };

    return sendSuccess(res, {
      data: {
        settings,
        lastUpdated: thresholdSetting?.updatedAt || feeSetting?.updatedAt || null,
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch delivery fee settings', error.message);
  }
};







