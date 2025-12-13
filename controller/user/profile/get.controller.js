import { User } from '../../../models/user.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return sendSuccess(res, { data: { user } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch profile', error.message);
  }
};


