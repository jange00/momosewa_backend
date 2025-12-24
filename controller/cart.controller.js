import { sendSuccess, sendError } from '../utils/response.js';
import { validatePromoCode } from '../utils/validatePromoCode.js';

// In-memory cart storage (in production, use Redis or database)
const carts = new Map();

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const cart = carts.get(req.user._id.toString()) || { items: [], promoCode: null };
    return sendSuccess(res, { data: { cart } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch cart', error.message);
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, variant, quantity = 1 } = req.body;

    if (!productId) {
      return sendError(res, 400, 'Product ID is required');
    }

    const userId = req.user._id.toString();
    const cart = carts.get(userId) || { items: [], promoCode: null };

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === productId && item.variant === variant
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, variant: variant || null, quantity });
    }

    carts.set(userId, cart);

    return sendSuccess(res, {
      data: { cart },
      message: 'Item added to cart',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to add item to cart', error.message);
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (!quantity || quantity < 1) {
      return sendError(res, 400, 'Valid quantity is required');
    }

    const userId = req.user._id.toString();
    const cart = carts.get(userId);

    if (!cart) {
      return sendError(res, 404, 'Cart not found');
    }

    const itemIndex = cart.items.findIndex((item, index) => index.toString() === itemId);

    if (itemIndex === -1) {
      return sendError(res, 404, 'Cart item not found');
    }

    cart.items[itemIndex].quantity = quantity;
    carts.set(userId, cart);

    return sendSuccess(res, {
      data: { cart },
      message: 'Cart item updated',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update cart item', error.message);
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id.toString();
    const cart = carts.get(userId);

    if (!cart) {
      return sendError(res, 404, 'Cart not found');
    }

    cart.items = cart.items.filter((item, index) => index.toString() !== itemId);
    carts.set(userId, cart);

    return sendSuccess(res, {
      data: { cart },
      message: 'Item removed from cart',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to remove item from cart', error.message);
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    carts.set(userId, { items: [], promoCode: null });

    return sendSuccess(res, { message: 'Cart cleared' });
  } catch (error) {
    return sendError(res, 500, 'Failed to clear cart', error.message);
  }
};

// Apply promo code to cart
export const applyPromoCode = async (req, res) => {
  try {
    const { promoCode } = req.body;
    const userId = req.user._id.toString();
    const cart = carts.get(userId);

    if (!cart || cart.items.length === 0) {
      return sendError(res, 400, 'Cart is empty');
    }

    // Calculate subtotal (simplified - in production, fetch product prices)
    const subtotal = 0; // TODO: Calculate from cart items

    const validation = await validatePromoCode(promoCode, subtotal);

    if (!validation.valid) {
      return sendError(res, 400, validation.message);
    }

    cart.promoCode = promoCode;
    carts.set(userId, cart);

    return sendSuccess(res, {
      data: { cart, discount: validation.discount },
      message: 'Promo code applied',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to apply promo code', error.message);
  }
};

