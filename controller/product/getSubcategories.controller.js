import { sendSuccess, sendError } from '../../utils/response.js';
import { getSubcategoriesByCategory as getSubcategories, getAllCategories } from '../../utils/productSubcategories.js';

// Get subcategories for a specific category
export const getSubcategoriesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return sendError(res, 400, 'Category parameter is required');
    }

    const validCategories = getAllCategories();
    
    if (!validCategories.includes(category)) {
      return sendError(res, 400, `Invalid category. Valid categories are: ${validCategories.join(', ')}`);
    }

    const subcategories = getSubcategories(category);

    return sendSuccess(res, {
      data: {
        category,
        subcategories,
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch subcategories', error.message);
  }
};




