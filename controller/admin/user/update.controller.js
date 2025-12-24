import { User } from '../../../models/user.js';
import { sendSuccess, sendError } from '../../../utils/response.js';

// Update user
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    if (phone) updates.phone = phone;
    if (role) updates.role = role;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, {
      data: { user },
      message: 'User updated successfully',
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'Email or phone already in use');
    }
    return sendError(res, 500, 'Failed to update user', error.message);
  }
};


