// Enhanced notification service with order updates and vendor approvals
import { Notification } from '../models/notification.js';

export function initNotificationSocket(io) {
  io.on('connection', (socket) => {
    // Authenticate socket to a user room
    socket.on('auth', ({ userId, token }) => {
      if (!userId) return;
      
      // TODO: Verify JWT token if provided
      socket.join(userRoom(userId));
      socket.emit('notifications:ready');
    });

    // Subscribe to order updates
    socket.on('order:subscribe', ({ orderId }) => {
      if (orderId) {
        socket.join(orderRoom(orderId));
      }
    });

    // Unsubscribe from order updates
    socket.on('order:unsubscribe', ({ orderId }) => {
      if (orderId) {
        socket.leave(orderRoom(orderId));
      }
    });

    // Vendor updates order status
    socket.on('order:status-update', async ({ orderId, status }) => {
      // TODO: Verify vendor permissions
      // Emit to order room
      io.to(orderRoom(orderId)).emit('order:status-changed', { orderId, status });
    });

    // Mark notification as read
    socket.on('notification:mark-read', async ({ notificationId }) => {
      // TODO: Verify user owns notification
      if (notificationId) {
        await Notification.findByIdAndUpdate(notificationId, { isRead: true });
      }
    });

    socket.on('disconnect', () => {
      // Cleanup handled by socket.io
    });
  });
}

export function userRoom(userId) {
  return `user:${userId}`;
}

export function vendorRoom(vendorId) {
  return `vendor:${vendorId}`;
}

export function orderRoom(orderId) {
  return `order:${orderId}`;
}

export function adminRoom() {
  return 'admin:dashboard';
}

// Utility to emit a notification to a specific user
export function emitNotification(io, userId, payload) {
  io.to(userRoom(userId)).emit('notification:new', payload);
}

// Emit order update to all subscribers
export function emitOrderUpdate(io, orderId, data) {
  io.to(orderRoom(orderId)).emit('order:status-changed', { orderId, ...data });
}

// Emit new order to vendor
export function emitNewOrder(io, vendorUserId, orderData) {
  io.to(userRoom(vendorUserId)).emit('order:new', orderData);
}

// Emit vendor approval notification
export function emitVendorApproval(io, vendorUserId, status, data) {
  const eventName = status === 'approved' 
    ? 'vendor:approval-approved' 
    : status === 'rejected' 
    ? 'vendor:approval-rejected' 
    : 'vendor:approval-pending';
  
  io.to(userRoom(vendorUserId)).emit(eventName, data);
}

// Update unread notification count
export async function emitNotificationCount(io, userId) {
  const count = await Notification.countDocuments({
    userId,
    isRead: false,
  });
  
  io.to(userRoom(userId)).emit('notification:count', { count });
}
