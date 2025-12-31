// Category to Subcategory mapping for products

export const CATEGORY_SUBCATEGORIES = {
  Steamed: [
    'Buff Momo',
    'Veg Momo',
    'Chicken Momo',
    'Pork Momo',
    'Paneer Momo',
    'Kothey Momo',
    'Jhol Momo',
    'C-Momo (Chilly)',
    'Momo Soup',
  ],
  Fried: [
    'Buff Fried Momo',
    'Veg Fried Momo',
    'Chicken Fried Momo',
    'Pan-fried Momo',
    'Deep-fried Momo',
    'Crispy Momo',
  ],
  Special: [
    'Buff Chilli Momo',
    'Veg Chilli Momo',
    'Chicken Chilli Momo',
    'Momo Platter',
    'Mixed Momo',
    'Sadeko Momo',
    'Schezwan Momo',
    'Tandoori Momo',
  ],
  Combo: [
    'Momo + Soup',
    'Momo + Drink',
    'Momo + Salad',
    'Family Combo',
    'Party Pack',
    'Momo + Cold Drink',
    'Momo + Hot Drink',
  ],
};

/**
 * Get all subcategories for a given category
 * @param {string} category - The category name
 * @returns {string[]} Array of subcategories
 */
export const getSubcategoriesByCategory = (category) => {
  return CATEGORY_SUBCATEGORIES[category] || [];
};

/**
 * Get all categories
 * @returns {string[]} Array of category names
 */
export const getAllCategories = () => {
  return Object.keys(CATEGORY_SUBCATEGORIES);
};

/**
 * Check if a subcategory is valid for a given category
 * @param {string} category - The category name
 * @param {string} subcategory - The subcategory to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidSubcategory = (category, subcategory) => {
  if (!category || !subcategory) return false;
  const allowedSubcategories = getSubcategoriesByCategory(category);
  return allowedSubcategories.includes(subcategory);
};

/**
 * Get all unique subcategories across all categories
 * @returns {string[]} Array of all subcategories
 */
export const getAllSubcategories = () => {
  const allSubcategories = [];
  Object.values(CATEGORY_SUBCATEGORIES).forEach((subcats) => {
    allSubcategories.push(...subcats);
  });
  return [...new Set(allSubcategories)]; // Remove duplicates
};



