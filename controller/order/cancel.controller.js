import { Order } from '../../models/order.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Cancel order
 */
export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Check cancellation rules
    if (req.user.role === 'Customer') {
      if (!['pending', 'preparing'].includes(order.status)) {
        return sendError(res, 400, 'Order cannot be cancelled at this stage');
      }
    }

    // Update order
    order.status = 'cancelled';
    order.cancelledDate = new Date();
    order.cancelledBy = req.user._id;
    order.cancelledReason = reason || null;

    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
      // TODO: Process refund via Khalti
    }

    await order.save();

    return sendSuccess(res, {
      data: { order },
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to cancel order', error.message);
  }
};


