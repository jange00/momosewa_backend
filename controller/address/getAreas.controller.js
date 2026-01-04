import { Address } from '../../models/address.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Get unique areas for a specific city
 */
export const getAreas = async (req, res) => {
  try {
    const { city } = req.params;

    if (!city) {
      return sendError(res, 400, 'City parameter is required');
    }

    // Get distinct areas for the given city
    const areas = await Address.distinct('area', {
      city: { $regex: new RegExp(`^${city}$`, 'i') }, // Case-insensitive match
    });

    // Sort areas alphabetically
    const sortedAreas = areas.sort();

    return sendSuccess(res, { data: { areas: sortedAreas, city } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch areas', error.message);
  }
};


