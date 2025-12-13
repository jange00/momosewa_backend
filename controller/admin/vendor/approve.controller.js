import { Vendor } from '../../../models/vendor.js';
import { VendorApplication } from '../../../models/vendorApplication.js';
import { User } from '../../../models/user.js';
import { sendSuccess, sendError } from '../../../utils/response.js';
import { emitVendorApproval, emitNotificationCount } from '../../../services/notificationSocket.js';
import { getIO } from '../../../services/socket.service.js';
import { createVendorApprovalNotification } from '../../../services/notification.service.js';

/**
 * Approve vendor application
 */
export const approveVendor = async (req, res) => {
  try {
    // Find the vendor application (include password field)
    const application = await VendorApplication.findById(req.params.id).select('+password');

    if (!application) {
      return sendError(res, 404, 'Vendor application not found');
    }

    if (application.status === 'approved') {
      return sendError(res, 400, 'Vendor application is already approved');
    }

    // Check if user already exists (in case of edge cases)
    let user = null;
    if (application.userId) {
      user = await User.findById(application.userId);
    }

    // If user doesn't exist, create it now (after approval)
    if (!user) {
      // Check if user with this email/phone already exists
      const existingUser = await User.findOne({
        $or: [{ email: application.email }, { phone: application.phone }],
      });

      if (existingUser) {
        return sendError(res, 400, 'A user with this email or phone already exists');
      }

      // Create User account after approval
      // Password is already hashed in VendorApplication
      // User model's pre-save hook will detect it's already hashed and skip re-hashing
      user = await User.create({
        name: application.name,
        email: application.email,
        phone: application.phone,
        password: application.password, // Already hashed - pre-save hook will detect and skip
        role: 'Vendor',
      });

      // Update application with userId
      application.userId = user._id;
    } else {
      // User already exists, just update role to Vendor
      if (user.role !== 'Vendor') {
        user.role = 'Vendor';
        await user.save();
      }
    }

    // Check if vendor already exists (shouldn't happen, but safety check)
    const existingVendor = await Vendor.findOne({ userId: user._id });
    if (existingVendor) {
      return sendError(res, 400, 'Vendor already exists for this user');
    }

    // Create Vendor document only after approval
    const vendor = await Vendor.create({
      userId: user._id,
      businessName: application.businessName,
      businessAddress: application.businessAddress,
      businessLicense: application.businessLicense,
      storeName: application.storeName,
      status: 'active',
      isActive: true,
      approvedDate: new Date(),
      approvedBy: req.user._id,
    });

    // Update application status
    application.status = 'approved';
    application.reviewedDate = new Date();
    application.reviewedBy = req.user._id;
    await application.save();

    // Emit notification
    try {
      const io = getIO();
      emitVendorApproval(io, user._id.toString(), 'approved', { vendorId: vendor._id });
      await createVendorApprovalNotification(user._id, 'approved', vendor._id);
      await emitNotificationCount(io, user._id.toString());
    } catch (error) {
      console.error('Error emitting vendor approval notification:', error);
    }

    return sendSuccess(res, {
      data: { vendor, user: { _id: user._id, email: user.email, name: user.name } },
      message: 'Vendor approved successfully. User account has been created.',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to approve vendor', error.message);
  }
};


