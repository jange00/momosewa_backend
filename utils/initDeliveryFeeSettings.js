import { AdminSettings } from '../models/adminSettings.js';

/**
 * Initialize default delivery fee settings if they don't exist
 * This can be called on server startup or manually
 */
export async function initDeliveryFeeSettings() {
  try {
    // Check if settings already exist
    const [existingThreshold, existingFee] = await Promise.all([
      AdminSettings.findOne({ key: 'delivery_free_threshold' }),
      AdminSettings.findOne({ key: 'delivery_fee' }),
    ]);

    // Create free delivery threshold setting if it doesn't exist
    if (!existingThreshold) {
      await AdminSettings.create({
        key: 'delivery_free_threshold',
        value: 500,
        description: 'Minimum order amount (in Rs.) for free delivery',
      });
      console.log('✅ Created default delivery free threshold setting (500)');
    }

    // Create delivery fee setting if it doesn't exist
    if (!existingFee) {
      await AdminSettings.create({
        key: 'delivery_fee',
        value: 50,
        description: 'Standard delivery fee (in Rs.)',
      });
      console.log('✅ Created default delivery fee setting (50)');
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error initializing delivery fee settings:', error);
    return { success: false, error: error.message };
  }
}
