import { AdminSettings } from '../models/adminSettings.js';

// Default values (fallback if admin settings not found)
const DEFAULT_FREE_DELIVERY_THRESHOLD = 500;
const DEFAULT_DELIVERY_FEE = 50;

/**
 * Get delivery fee settings from database or return defaults
 */
async function getDeliveryFeeSettings() {
  try {
    const [thresholdSetting, feeSetting] = await Promise.all([
      AdminSettings.findOne({ key: 'delivery_free_threshold' }),
      AdminSettings.findOne({ key: 'delivery_fee' }),
    ]);

    return {
      freeDeliveryThreshold: thresholdSetting?.value || DEFAULT_FREE_DELIVERY_THRESHOLD,
      deliveryFee: feeSetting?.value || DEFAULT_DELIVERY_FEE,
    };
  } catch (error) {
    console.error('Error fetching delivery fee settings:', error);
    // Return defaults on error
    return {
      freeDeliveryThreshold: DEFAULT_FREE_DELIVERY_THRESHOLD,
      deliveryFee: DEFAULT_DELIVERY_FEE,
    };
  }
}

/**
 * Calculate delivery fee based on order total
 * Fetches settings from AdminSettings (configurable by admin)
 * Falls back to defaults if settings not found
 */
export async function calculateDeliveryFee(orderTotal) {
  const settings = await getDeliveryFeeSettings();
  
  return orderTotal > settings.freeDeliveryThreshold ? 0 : settings.deliveryFee;
}

/**
 * Get delivery fee settings (for public API endpoint)
 */
export async function getDeliveryFeeSettingsForAPI() {
  return await getDeliveryFeeSettings();
}


