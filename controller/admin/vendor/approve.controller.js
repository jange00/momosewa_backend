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
    // Find the vendor application
    const application = await VendorApplication.findById(req.params.id);

    if (!application) {
      return sendError(res, 404, 'Vendor application not found');
    }

    if (application.status === 'approved') {
      return sendError(res, 400, 'Vendor application is already approved');
    }

    // Check if vendor already exists (shouldn't happen, but safety check)
    const existingVendor = await Vendor.findOne({ userId: application.userId });
    if (existingVendor) {
      return sendError(res, 400, 'Vendor already exists for this user');
    }

    // Create Vendor document only after approval
    const vendor = await Vendor.create({
      userId: application.userId,
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

    // Change user role from Customer to Vendor after approval
    const user = await User.findById(application.userId);
    if (user && user.role !== 'Vendor') {
      user.role = 'Vendor';
      await user.save();
    }

    // Emit notification
    try {
      const io = getIO();
      emitVendorApproval(io, application.userId.toString(), 'approved', { vendorId: vendor._id });
      await createVendorApprovalNotification(application.userId, 'approved', vendor._id);
      await emitNotificationCount(io, application.userId.toString());
    } catch (error) {
      console.error('Error emitting vendor approval notification:', error);
    }

    return sendSuccess(res, {
      data: { vendor },
      message: 'Vendor approved successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to approve vendor', error.message);
  }
};


