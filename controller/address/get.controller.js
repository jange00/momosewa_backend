import { Address } from '../../models/address.js';
import { sendSuccess, sendError } from '../../utils/response.js';


// Get user's saved addresses 
 // Query params:
// city (optional): Filter by city (Kathmandu, Bhaktapur, Lalitpur, Kritipur)
 
export const getAddresses = async (req, res) => {
  try {
    const { city } = req.query;
    
    // Build query
    let query = { userId: req.user._id };
    
    // If city is provided, filter by city (case-insensitive)
    if (city) {
      const validCities = ['Kathmandu', 'Bhaktapur', 'Lalitpur', 'Kritipur'];
      const cityNormalized = city.trim();
      
      // Find matching city (case-insensitive)
      const matchedCity = validCities.find(
        validCity => validCity.toLowerCase() === cityNormalized.toLowerCase()
      );
      
      if (matchedCity) {
        query.city = matchedCity; // Use the properly capitalized city name
      } else {
        return sendError(res, 400, `Invalid city. Must be one of: ${validCities.join(', ')}`);
      }
    }
    
    const addresses = await Address.find(query).sort({ isDefault: -1, createdAt: -1 });
    
    return sendSuccess(res, { 
      data: { 
        addresses,
        total: addresses.length,
        ...(city && { filteredBy: city })
      } 
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch addresses', error.message);
  }
};


