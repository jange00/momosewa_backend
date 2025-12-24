import { Vendor } from '../../models/vendor.js';
import { VendorApplication } from '../../models/vendorApplication.js';
import { User } from '../../models/user.js';
import { Order } from '../../models/order.js';
import { Product } from '../../models/product.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalVendors,
      activeVendors,
      pendingVendors,
      totalOrders,
      totalRevenue,
      totalProducts,
    ] = await Promise.all([
      User.countDocuments(),
      Vendor.countDocuments(),
      Vendor.countDocuments({ status: 'active' }),
      VendorApplication.countDocuments({ status: 'pending' }), // Fixed: Count from VendorApplication, not Vendor
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Product.countDocuments(),
    ]);

    const revenue = totalRevenue[0]?.total || 0;

    return sendSuccess(res, {
      data: {
        stats: {
          totalUsers,
          totalVendors,
          activeVendors,
          pendingVendors,
          totalOrders,
          totalRevenue: revenue,
          totalProducts,
        },
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch dashboard stats', error.message);
  }
};


