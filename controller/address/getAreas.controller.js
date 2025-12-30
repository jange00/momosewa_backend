import { sendSuccess, sendError } from '../../utils/response.js';
import { getAreasByCity as getCityAreas } from '../../utils/cityAreas.js';

// Get areas for a specific city
// GET /addresses/areas/:city
 
export const getAreasByCity = async (req, res) => {
  try {
    const { city } = req.params;

    if (!city) {
      return sendError(res, 400, 'City parameter is required');
    }

    const validCities = ['Kathmandu', 'Bhaktapur', 'Lalitpur', 'Kritipur'];
    const cityNormalized = city.trim();

    // Find matching city (case-insensitive)
    const matchedCity = validCities.find(
      validCity => validCity.toLowerCase() === cityNormalized.toLowerCase()
    );

    if (!matchedCity) {
      return sendError(res, 400, `Invalid city. Must be one of: ${validCities.join(', ')}`);
    }

    const areas = getCityAreas(matchedCity);

    return sendSuccess(res, {
      data: {
        city: matchedCity,
        areas,
        count: areas.length,
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch areas', error.message);
  }
};












