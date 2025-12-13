import { User } from '../../../models/user.js';
import { sendSuccess, sendError } from '../../../utils/response.js';
import { deleteFromCloudinary } from '../../../middlewares/upload.middleware.js';

/**
 * Delete profile picture
 */
export const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.profilePicture) {
      await deleteFromCloudinary(user.profilePicture);
      user.profilePicture = null;
      await user.save();
    }

    return sendSuccess(res, { message: 'Profile picture deleted successfully' });
  } catch (error) {
    return sendError(res, 500, 'Failed to delete profile picture', error.message);
  }
};


