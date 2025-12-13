import { PromoCode } from '../models/promoCode.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { validatePromoCode } from '../utils/validatePromoCode.js';

/**
 * Get active promo codes (public)
 */
export const getPromoCodes = async (req, res) => {
  try {
    const promoCodes = await PromoCode.find({
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    }).sort({ createdAt: -1 });

    return sendSuccess(res, { data: { promoCodes } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch promo codes', error.message);
  }
};

/**
 * Create promo code (Admin only)
 */
export const createPromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.create(req.body);

    return sendSuccess(res, {
      data: { promoCode },
      message: 'Promo code created successfully',
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'Promo code already exists');
    }
    return sendError(res, 500, 'Failed to create promo code', error.message);
  }
};

/**
 * Update promo code (Admin only)
 */
export const updatePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!promoCode) {
      return sendError(res, 404, 'Promo code not found');
    }

    return sendSuccess(res, {
      data: { promoCode },
      message: 'Promo code updated successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update promo code', error.message);
  }
};

/**
 * Delete promo code (Admin only)
 */
export const deletePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findByIdAndDelete(req.params.id);

    if (!promoCode) {
      return sendError(res, 404, 'Promo code not found');
    }

    return sendSuccess(res, { message: 'Promo code deleted successfully' });
  } catch (error) {
    return sendError(res, 500, 'Failed to delete promo code', error.message);
  }
};

/**
 * Validate promo code
 */
export const validatePromo = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;

    const validation = await validatePromoCode(code, orderTotal);

    return sendSuccess(res, {
      data: {
        valid: validation.valid,
        discount: validation.discount,
        message: validation.message,
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to validate promo code', error.message);
  }
};


