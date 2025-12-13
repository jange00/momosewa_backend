import { User } from '../../../models/user.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

/**
 * Delete user
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, { message: 'User deleted successfully' });
  } catch (error) {
    return sendError(res, 500, 'Failed to delete user', error.message);
  }
};


