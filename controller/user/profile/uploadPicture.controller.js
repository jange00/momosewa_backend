import { User } from '../../../models/user.js';
import { sendSuccess, sendError } from '../../../utils/response.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../../middlewares/upload.middleware.js';

// Upload profile picture
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

    // Determine folder based on user role
    const folder = user.role === 'Vendor' 
      ? 'momosewa/vendor-profiles' 
      : 'momosewa/customer-profiles';

    // Upload new picture
    const imageUrl = await uploadToCloudinary(req.file, folder);
    user.profilePicture = imageUrl;
    await user.save();

    return sendSuccess(res, {
      data: { profilePicture: imageUrl },
      message: 'Profile picture uploaded successfully',
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    return sendError(res, 500, 'Failed to upload profile picture', error.message || error.details || 'Unknown error');
  }
};


