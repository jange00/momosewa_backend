import { Order } from '../../models/order.js';
import { Vendor } from '../../models/vendor.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Get user's orders
 */
export const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    // Filter by user role
    if (req.user.role === 'Customer') {
      query.customerId = req.user._id;
    } else if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ userId: req.user._id });
      if (vendor) {
        query.vendorId = vendor._id;
      } else {
        return sendError(res, 404, 'Vendor profile not found');
      }
    }
    // Admin can see all orders

    if (status) {
      query.status = status;
    }

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


