import { User } from '../../../models/user.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

/**
 * Get user details
 */
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, { data: { user } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch user', error.message);
  }
};


