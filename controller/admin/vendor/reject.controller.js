import { VendorApplication } from '../../../models/vendorApplication.js';
import { sendSuccess, sendError } from '../../../utils/response.js';
import { emitVendorApproval, emitNotificationCount } from '../../../services/notificationSocket.js';
import { getIO } from '../../../services/socket.service.js';
import { createVendorApprovalNotification } from '../../../services/notification.service.js';

/**
 * Reject vendor application
 */
export const rejectVendor = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return sendError(res, 400, 'Rejection reason is required');
    }

    const application = await VendorApplication.findById(req.params.id);

    if (!application) {
      return sendError(res, 404, 'Vendor application not found');
    }

    // Update application status to rejected
    application.status = 'rejected';
    application.reviewedDate = new Date();
    application.reviewedBy = req.user._id;
    application.rejectedReason = reason;
    await application.save();

    // Emit notification only if user account exists (userId is set)
    // If no userId, the application was rejected before approval, so no user account exists yet
    if (application.userId) {
      try {
        const io = getIO();
        emitVendorApproval(io, application.userId.toString(), 'rejected', { applicationId: application._id, reason });
        await createVendorApprovalNotification(application.userId, 'rejected', application._id, reason);
        await emitNotificationCount(io, application.userId.toString());
      } catch (error) {
        console.error('Error emitting vendor rejection notification:', error);
      }
    }

    return sendSuccess(res, {
      data: { application },
      message: 'Vendor application rejected successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to reject vendor', error.message);
  }
};


