import { Order } from '../../models/order.js';
import { Vendor } from '../../models/vendor.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// Get order details
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('vendorId', 'storeName businessName')
      .populate('items.productId', 'name image');

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Check permissions
    if (req.user.role === 'Customer' && order.customerId._id.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ userId: req.user._id });
      if (vendor && order.vendorId._id.toString() !== vendor._id.toString()) {
        return sendError(res, 403, 'Access denied');
      }
    }

    return sendSuccess(res, { data: { order } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch order', error.message);
  }
};


