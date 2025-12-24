import { PromoCode } from '../models/promoCode.js';

// Validate and calculate discount for a promo code

export async function validatePromoCode(code, orderTotal) {
  if (!code) {
    return { valid: false, discount: 0, message: 'Promo code is required' };
  }

  const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });

  if (!promoCode) {
    return { valid: false, discount: 0, message: 'Invalid promo code' };
  }

  if (!promoCode.isValid()) {
    return { valid: false, discount: 0, message: 'Promo code is expired or inactive' };
  }

  if (orderTotal < promoCode.minOrderAmount) {
    return {
      valid: false,
      discount: 0,
      message: `Minimum order amount of Rs. ${promoCode.minOrderAmount} required`,
    };
  }

  let discount = 0;

  if (promoCode.discountType === 'percentage') {
    discount = (orderTotal * promoCode.discountValue) / 100;
    if (promoCode.maxDiscount && discount > promoCode.maxDiscount) {
      discount = promoCode.maxDiscount;
    }
  } else {
    discount = promoCode.discountValue;
  }

  // Ensure discount doesn't exceed order total
  discount = Math.min(discount, orderTotal);

  return {
    valid: true,
    discount,
    message: 'Promo code applied successfully',
    promoCode,
  };
}


