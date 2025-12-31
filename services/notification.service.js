import { Notification } from '../models/notification.js';
import { Order } from '../models/order.js';
import { User } from '../models/user.js';
import { Product } from '../models/product.js';
import { Vendor } from '../models/vendor.js';
import { emitNotification, emitNotificationCount } from './notificationSocket.js';
import { getIO } from './socket.service.js';

// Create a notification for a user
export async function createNotification(userId, type, title, message, data = null, recipientRole = null) {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      recipientRole,
    });

    // Emit real-time notification
    try {
      const io = getIO();
      emitNotification(io, userId.toString(), {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });
      await emitNotificationCount(io, userId.toString());
    } catch (error) {
      console.error('Error emitting notification:', error);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// ==================== CUSTOMER NOTIFICATIONS ====================

// Create customer order notification
export async function createCustomerOrderNotification(customerId, orderId, status, orderData = null) {
  const statusMessages = {
    pending: 'Your order has been placed successfully!',
    preparing: 'Your order is being prepared',
    'on-the-way': 'Your order is on the way to you',
    delivered: 'Your order has been delivered. Enjoy your meal!',
    cancelled: 'Your order has been cancelled',
  };

  const titles = {
    pending: 'Order Placed',
    preparing: 'Order Being Prepared',
    'on-the-way': 'Order Out for Delivery',
    delivered: 'Order Delivered',
    cancelled: 'Order Cancelled',
  };

  return createNotification(
    customerId,
    'order',
    titles[status] || 'Order Update',
    statusMessages[status] || 'Your order status has been updated',
    { orderId, status, ...orderData },
    'Customer'
  );
}

// Create customer payment notification
export async function createCustomerPaymentNotification(customerId, orderId, status, amount = null) {
  const messages = {
    paid: 'Your payment has been processed successfully',
    failed: 'Your payment failed. Please try again',
    refunded: 'Your payment has been refunded',
    processing: 'Your payment is being processed',
  };

  const titles = {
    paid: 'Payment Successful',
    failed: 'Payment Failed',
    refunded: 'Payment Refunded',
    processing: 'Processing Payment',
  };

  return createNotification(
    customerId,
    'payment',
    titles[status] || 'Payment Update',
    messages[status] || 'Your payment status has been updated',
    { orderId, status, amount },
    'Customer'
  );
}

// ==================== VENDOR NOTIFICATIONS ====================

// Create vendor new order notification
export async function createVendorNewOrderNotification(vendorUserId, orderId, orderData) {
  const order = orderData || await Order.findById(orderId).populate('customerId', 'name');
  
  if (!order) {
    console.error('Order not found for notification:', orderId);
    return null;
  }

  const customerName = order.customerId?.name || 'Customer';
  const itemsCount = order.items?.length || 0;
  const productNames = order.items?.slice(0, 2).map(item => item.name).join(', ') || 'items';
  const moreItems = itemsCount > 2 ? ` and ${itemsCount - 2} more` : '';

  const title = `New Order #${order.orderId}`;
  const message = `Customer ${customerName} placed an order for ${productNames}${moreItems}. Total: Rs. ${order.total}`;

  return createNotification(
    vendorUserId,
    'order',
    title,
    message,
    {
      orderId: order._id,
      orderIdStr: order.orderId,
      status: order.status,
      total: order.total,
      itemsCount,
      customerName,
      customerId: order.customerId?._id,
    },
    'Vendor'
  );
}

// Create vendor order status update notification (for vendor's own actions)
export async function createVendorOrderStatusNotification(vendorUserId, orderId, status, orderData = null) {
  const order = orderData || await Order.findById(orderId);
  
  if (!order) {
    console.error('Order not found for notification:', orderId);
    return null;
  }

  const orderIdStr = order.orderId || orderId;
  const statusMessages = {
    preparing: `Order #${orderIdStr} is ready for preparation`,
    'on-the-way': `Order #${orderIdStr} has been dispatched for delivery`,
    delivered: `Order #${orderIdStr} has been delivered successfully`,
  };

  const titles = {
    preparing: 'Order Ready to Prepare',
    'on-the-way': 'Order Dispatched',
    delivered: 'Order Delivered',
  };

  // Only notify vendor about status changes they make (not pending or cancelled)
  if (!statusMessages[status]) {
    return null;
  }

  return createNotification(
    vendorUserId,
    'order',
    titles[status] || 'Order Status Update',
    statusMessages[status] || `Order #${orderIdStr} status updated to ${status}`,
    { orderId: order._id, orderIdStr, status },
    'Vendor'
  );
}

// Create vendor order cancellation notification
export async function createVendorOrderCancellationNotification(vendorUserId, orderId, customerName, reason = null) {
  const order = await Order.findById(orderId);
  
  if (!order) {
    console.error('Order not found for notification:', orderId);
    return null;
  }

  const orderIdStr = order.orderId || orderId;
  const title = `Order #${orderIdStr} Cancelled`;
  const message = reason
    ? `Customer ${customerName} cancelled Order #${orderIdStr}. Reason: ${reason}`
    : `Customer ${customerName} cancelled Order #${orderIdStr}`;

  return createNotification(
    vendorUserId,
    'order',
    title,
    message,
    { orderId: order._id, orderIdStr, status: 'cancelled', customerName, reason },
    'Vendor'
  );
}

// Create vendor payment notification
export async function createVendorPaymentNotification(vendorUserId, orderId, status, amount = null) {
  const order = await Order.findById(orderId);
  
  if (!order) {
    console.error('Order not found for notification:', orderId);
    return null;
  }

  const orderIdStr = order.orderId || orderId;
  const messages = {
    paid: `Payment received for Order #${orderIdStr}`,
    failed: `Payment failed for Order #${orderIdStr}`,
    refunded: `Payment refunded for Order #${orderIdStr}`,
  };

  const titles = {
    paid: 'Payment Received',
    failed: 'Payment Failed',
    refunded: 'Payment Refunded',
  };

  return createNotification(
    vendorUserId,
    'payment',
    titles[status] || 'Payment Update',
    messages[status] || `Payment status updated for Order #${orderIdStr}`,
    { orderId: order._id, orderIdStr, status, amount },
    'Vendor'
  );
}

// Create vendor review notification
export async function createVendorReviewNotification(vendorUserId, reviewId, productName, customerName, rating, comment = null) {
  const title = 'New Review Received';
  const commentPreview = comment ? (comment.length > 50 ? comment.substring(0, 50) + '...' : comment) : '';
  const message = commentPreview
    ? `Customer ${customerName} left a ${rating}-star review for ${productName}: "${commentPreview}"`
    : `Customer ${customerName} left a ${rating}-star review for ${productName}`;

  return createNotification(
    vendorUserId,
    'review',
    title,
    message,
    { reviewId, productName, customerName, rating, comment },
    'Vendor'
  );
}

// Create vendor inventory alert
export async function createVendorInventoryAlert(vendorUserId, productId, productName, stock, threshold = 5) {
  const title = stock === 0 ? 'Product Out of Stock' : 'Low Stock Alert';
  const message = stock === 0
    ? `Product "${productName}" is out of stock`
    : `Low stock alert: "${productName}" has only ${stock} items remaining`;

  return createNotification(
    vendorUserId,
    'inventory',
    title,
    message,
    { productId, productName, stock, threshold },
    'Vendor'
  );
}

// Create vendor approval notification (existing - keeping for compatibility)
export async function createVendorApprovalNotification(userId, status, vendorId, reason = null) {
  const messages = {
    approved: 'Your vendor application has been approved! You can now access your dashboard.',
    rejected: `Your vendor application has been rejected. Reason: ${reason || 'Not specified'}`,
    pending: 'Your vendor application is under review',
  };

  return createNotification(
    userId,
    'vendor_approval',
    'Vendor Application Update',
    messages[status] || 'Your vendor application status has been updated',
    { vendorId, status, reason },
    'Vendor'
  );
}

// ==================== LEGACY FUNCTIONS (for backward compatibility) ====================

// Legacy order notification (creates customer notification by default)
export async function createOrderNotification(userId, orderId, status) {
  // Determine if user is customer or vendor by checking order
  const order = await Order.findById(orderId);
  if (!order) {
    console.error('Order not found:', orderId);
    return null;
  }

  // If user is the customer, create customer notification
  if (order.customerId.toString() === userId.toString()) {
    return createCustomerOrderNotification(userId, orderId, status);
  }

  // If user is the vendor, create vendor notification
  if (order.vendorId) {
    const vendor = await Vendor.findOne({ _id: order.vendorId });
    if (vendor && vendor.userId.toString() === userId.toString()) {
      return createVendorOrderStatusNotification(userId, orderId, status);
    }
  }

  // Default to customer notification
  return createCustomerOrderNotification(userId, orderId, status);
}

// Legacy payment notification (creates customer notification by default)
export async function createPaymentNotification(userId, orderId, status) {
  const order = await Order.findById(orderId);
  if (!order) {
    console.error('Order not found:', orderId);
    return null;
  }

  // If user is the customer, create customer notification
  if (order.customerId.toString() === userId.toString()) {
    return createCustomerPaymentNotification(userId, orderId, status, order.total);
  }

  // If user is the vendor, create vendor notification
  if (order.vendorId) {
    const vendor = await Vendor.findOne({ _id: order.vendorId });
    if (vendor && vendor.userId.toString() === userId.toString()) {
      return createVendorPaymentNotification(userId, orderId, status, order.total);
    }
  }

  // Default to customer notification
  return createCustomerPaymentNotification(userId, orderId, status, order.total);
}
