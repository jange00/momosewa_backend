import { Order } from '../../models/order.js';
import { Product } from '../../models/product.js';
import { Vendor } from '../../models/vendor.js';
import { User } from '../../models/user.js';
import { generateOrderId } from '../../utils/generateOrderId.js';
import { calculateDeliveryFee } from '../../utils/calculateDeliveryFee.js';
import { validatePromoCode } from '../../utils/validatePromoCode.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { emitNewOrder } from '../../services/notificationSocket.js';
import { getIO } from '../../services/socket.service.js';
import {
  createCustomerOrderNotification,
  createVendorNewOrderNotification,
  createVendorInventoryAlert,
} from '../../services/notification.service.js';

// Create new order (Customer)
export const createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, promoCode, notes } = req.body;

    if (!items || items.length === 0) {
      return sendError(res, 400, 'Order must have at least one item');
    }

    // Validate items and calculate subtotal
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return sendError(res, 400, `Product ${item.productId} not found`);
      }

      if (!product.isAvailable) {
        return sendError(res, 400, `Product ${product.name} is not available`);
      }

      if (product.stock !== -1 && product.stock < item.quantity) {
        return sendError(res, 400, `Insufficient stock for ${product.name}`);
      }

      const itemPrice = item.variant
        ? product.variants.find((v) => v.name === item.variant)?.price || product.price
        : product.price;

      subtotal += itemPrice * item.quantity;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        variant: item.variant || null,
        price: itemPrice,
        quantity: item.quantity,
        emoji: product.emoji,
      });

      // Track products for stock update and inventory alerts
      if (product.stock !== -1) {
        const oldStock = product.stock;
        product.stock -= item.quantity;
        productsToUpdate.push({ product, oldStock });
      }
    }

    // Validate promo code
    let discount = 0;
    if (promoCode) {
      const promoValidation = await validatePromoCode(promoCode, subtotal);
      if (!promoValidation.valid) {
        return sendError(res, 400, promoValidation.message);
      }
      discount = promoValidation.discount;
    }

    // Calculate delivery fee
    const deliveryFee = await calculateDeliveryFee(subtotal - discount);

    // Calculate total
    const total = subtotal - discount + deliveryFee;

    // Get vendor from first item
    const firstProduct = await Product.findById(items[0].productId);
    const vendor = await Vendor.findById(firstProduct.vendorId);

    if (!vendor || vendor.status !== 'active') {
      return sendError(res, 400, 'Vendor is not available');
    }

    // Create order
    const order = await Order.create({
      orderId: generateOrderId(),
      customerId: req.user._id,
      vendorId: vendor._id,
      items: validatedItems,
      subtotal,
      deliveryFee,
      discount,
      promoCode: promoCode || null,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash-on-delivery' ? 'pending' : 'pending',
      deliveryAddress,
      notes: notes || null,
    });

    // Save product stock updates and create inventory alerts
    try {
      for (const { product, oldStock } of productsToUpdate) {
        await product.save();
        
        // Check for low stock alerts (threshold: 5)
        // Only alert if stock just dropped below threshold (was above 5, now 5 or less)
        if (oldStock > 5 && product.stock <= 5) {
          await createVendorInventoryAlert(
            vendor.userId,
            product._id,
            product.name,
            product.stock,
            5
          );
        }
        // Alert if product is out of stock
        if (oldStock > 0 && product.stock === 0) {
          await createVendorInventoryAlert(
            vendor.userId,
            product._id,
            product.name,
            0,
            5
          );
        }
      }
    } catch (error) {
      console.error('Error updating product stock and creating inventory alerts:', error);
    }

    // Create notifications for vendor and customer
    try {
      const io = getIO();
      
      // Notify vendor about new order
      const vendorUser = await User.findById(vendor.userId);
      if (vendorUser) {
        emitNewOrder(io, vendor.userId.toString(), { orderId: order._id, order });
        await createVendorNewOrderNotification(vendor.userId, order._id, order);
      }

      // Notify customer that order was placed
      await createCustomerOrderNotification(req.user._id, order._id, 'pending', {
        orderId: order.orderId,
        total: order.total,
        itemsCount: order.items.length,
      });
    } catch (error) {
      console.error('Error emitting order notification:', error);
    }

    return sendSuccess(res, {
      data: { order },
      message: 'Order created successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to create order', error.message);
  }
};


