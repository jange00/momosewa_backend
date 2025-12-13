import { Product } from '../../models/product.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Get all products (with filters)
 */
export const getProducts = async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      minRating,
      vendor,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isAvailable: true };

    if (category) query.category = category;
    if (vendor) query.vendorId = vendor;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (minRating) query.rating = { $gte: Number(minRating) };
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate('vendorId', 'storeName businessName')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    return sendSuccess(res, {
      data: {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch products', error.message);
  }
};


