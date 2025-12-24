import { Vendor } from '../../../models/vendor.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

// Get all vendors (with filters)
export const getVendors = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { storeName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const vendors = await Vendor.find(query)
      .populate('userId', 'name email phone')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Vendor.countDocuments(query);

    return sendSuccess(res, {
      data: {
        vendors,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch vendors', error.message);
  }
};


