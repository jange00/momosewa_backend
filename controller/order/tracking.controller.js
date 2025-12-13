import { Order } from '../../models/order.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Track order status
 */
export const trackOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name phone')
      .populate('vendorId', 'storeName');

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Check permissions
    if (req.user.role === 'Customer' && order.customerId._id.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    return sendSuccess(res, {
      data: {
        orderId: order.orderId,
        status: order.status,
        estimatedDelivery: order.estimatedDelivery,
        deliveredDate: order.deliveredDate,
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to track order', error.message);
  }
};


