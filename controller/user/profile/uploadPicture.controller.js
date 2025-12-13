import { User } from '../../../models/user.js';
import { sendSuccess, sendError } from '../../../utils/response.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../../middlewares/upload.middleware.js';

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Profile picture is required');
    }

    const user = await User.findById(req.user._id);

    // Delete old profile picture if exists
    if (user.profilePicture) {
      await deleteFromCloudinary(user.profilePicture);
    }

    // Upload new picture
    const imageUrl = await uploadToCloudinary(req.file);
    user.profilePicture = imageUrl;
    await user.save();

    return sendSuccess(res, {
      data: { profilePicture: imageUrl },
      message: 'Profile picture uploaded successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to upload profile picture', error.message);
  }
};


