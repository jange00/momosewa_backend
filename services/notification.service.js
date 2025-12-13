import { Notification } from '../models/notification.js';

/**
 * Create a notification for a user
 */
export async function createNotification(userId, type, title, message, data = null) {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Create order notification
 */
export async function createOrderNotification(userId, orderId, status) {
  const statusMessages = {
    pending: 'Your order has been placed',
    preparing: 'Your order is being prepared',
    'on-the-way': 'Your order is on the way',
    delivered: 'Your order has been delivered',
    cancelled: 'Your order has been cancelled',
  };

  return createNotification(
    userId,
    'order',
    'Order Update',
    statusMessages[status] || 'Your order status has been updated',
    { orderId, status }
  );
}

/**
 * Create vendor approval notification
 */
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
    { vendorId, status, reason }
  );
}

/**
 * Create payment notification
 */
export async function createPaymentNotification(userId, orderId, status) {
  const messages = {
    paid: 'Your payment has been processed successfully',
    failed: 'Your payment failed. Please try again',
    refunded: 'Your payment has been refunded',
  };

  return createNotification(
    userId,
    'payment',
    'Payment Update',
    messages[status] || 'Your payment status has been updated',
    { orderId, status }
  );
}


