import { Order } from '../../../models/order.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

/**
 * Get order details (admin)
 */
export const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('vendorId', 'storeName businessName')
      .populate('items.productId', 'name image');

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    return sendSuccess(res, { data: { order } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch order', error.message);
  }
};


