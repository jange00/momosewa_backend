import { Product } from '../../models/product.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Get products by subcategory (veg, chicken, buff, etc.)
 */
export const getProductsBySubcategory = async (req, res) => {
  try {
    const { subcategory } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!subcategory) {
      return sendError(res, 400, 'Subcategory parameter is required');
    }

    // Validate subcategory
    const validSubcategories = ['veg', 'chicken', 'buff', 'pork', 'mutton', 'seafood'];
    const normalizedSubcategory = subcategory.toLowerCase();
    
    if (!validSubcategories.includes(normalizedSubcategory)) {
      return sendError(res, 400, `Invalid subcategory. Must be one of: ${validSubcategories.join(', ')}`);
    }

    const query = {
      subcategory: normalizedSubcategory,
      isAvailable: true,
    };

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate('vendorId', 'storeName businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    return sendSuccess(res, {
      data: {
        products,
        subcategory: normalizedSubcategory,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch products by subcategory', error.message);
  }
};

