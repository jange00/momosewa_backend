import { User } from '../../../models/user.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone) updates.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return sendSuccess(res, {
      data: { user },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'Phone number already in use');
    }
    return sendError(res, 500, 'Failed to update profile', error.message);
  }
};


