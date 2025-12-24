import { Order } from '../../../models/order.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

// Get all orders (admin)
export const getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(query)
      .populate('customerId', 'name email phone')
      .populate('vendorId', 'storeName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    return sendSuccess(res, {
      data: {
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch orders', error.message);
  }
};


