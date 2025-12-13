import { User } from '../../../models/user.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

/**
 * Change password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Current password and new password are required');
    }

    const user = await User.findById(req.user._id).select('+password');
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return sendError(res, 401, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, { message: 'Password changed successfully' });
  } catch (error) {
    return sendError(res, 500, 'Failed to change password', error.message);
  }
};


