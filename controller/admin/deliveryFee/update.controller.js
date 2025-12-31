import { AdminSettings } from '../../../models/adminSettings.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

// Update delivery fee settings
export const updateDeliveryFeeSettings = async (req, res) => {
  try {
    const { freeDeliveryThreshold, deliveryFee } = req.body;

    // Validate inputs
    if (freeDeliveryThreshold !== undefined && (isNaN(freeDeliveryThreshold) || freeDeliveryThreshold < 0)) {
      return sendError(res, 400, 'Free delivery threshold must be a positive number');
    }

    if (deliveryFee !== undefined && (isNaN(deliveryFee) || deliveryFee < 0)) {
      return sendError(res, 400, 'Delivery fee must be a positive number');
    }

    const updates = [];

    // Update or create free delivery threshold setting
    if (freeDeliveryThreshold !== undefined) {
      const thresholdSetting = await AdminSettings.findOneAndUpdate(
        { key: 'delivery_free_threshold' },
        {
          key: 'delivery_free_threshold',
          value: Number(freeDeliveryThreshold),
          description: 'Minimum order amount (in Rs.) for free delivery',
          updatedBy: req.user._id,
        },
        { upsert: true, new: true }
      );
      updates.push(thresholdSetting);
    }

    // Update or create delivery fee setting
    if (deliveryFee !== undefined) {
      const feeSetting = await AdminSettings.findOneAndUpdate(
        { key: 'delivery_fee' },
        {
          key: 'delivery_fee',
          value: Number(deliveryFee),
          description: 'Standard delivery fee (in Rs.)',
          updatedBy: req.user._id,
        },
        { upsert: true, new: true }
      );
      updates.push(feeSetting);
    }

    // Fetch updated settings
    const [thresholdSetting, feeSetting] = await Promise.all([
      AdminSettings.findOne({ key: 'delivery_free_threshold' }),
      AdminSettings.findOne({ key: 'delivery_fee' }),
    ]);

    const settings = {
      freeDeliveryThreshold: thresholdSetting?.value || 500,
      deliveryFee: feeSetting?.value || 50,
    };

    return sendSuccess(res, {
      data: { settings },
      message: 'Delivery fee settings updated successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update delivery fee settings', error.message);
  }
};

