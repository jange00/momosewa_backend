import { Order } from '../../models/order.js';
import { Vendor } from '../../models/vendor.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { emitOrderUpdate } from '../../services/notificationSocket.js';
import { getIO } from '../../services/socket.service.js';
import {
  createCustomerOrderNotification,
  createVendorOrderStatusNotification,
} from '../../services/notification.service.js';

// Update order status (Vendor/Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'on-the-way', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return sendError(res, 400, 'Invalid order status');
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Check permissions
    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ userId: req.user._id });
      if (!vendor || order.vendorId.toString() !== vendor._id.toString()) {
        return sendError(res, 403, 'Access denied');
      }
    }

    // Update status
    order.status = status;

    if (status === 'delivered') {
      order.deliveredDate = new Date();
      order.paymentStatus = 'paid';
    }

    await order.save();

    // Emit notifications to customer and vendor
    try {
      const io = getIO();
      emitOrderUpdate(io, order._id.toString(), { status });

      // Notify customer about status update
      await createCustomerOrderNotification(
        order.customerId,
        order._id,
        status,
        { orderId: order.orderId }
      );

      // If vendor is updating status, also notify vendor (for their own records)
      if (req.user.role === 'Vendor') {
        await createVendorOrderStatusNotification(
          req.user._id,
          order._id,
          status,
          order
        );
      }
    } catch (error) {
      console.error('Error emitting order status update:', error);
    }

    return sendSuccess(res, {
      data: { order },
      message: 'Order status updated successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update order status', error.message);
  }
};


