import { Notification } from '../models/notification.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Get user's notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Notification.countDocuments(query);

    return sendSuccess(res, {
      data: {
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch notifications', error.message);
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    return sendSuccess(res, { data: { count } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch unread count', error.message);
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return sendError(res, 404, 'Notification not found');
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    notification.isRead = true;
    await notification.save();

    return sendSuccess(res, {
      data: { notification },
      message: 'Notification marked as read',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to mark notification as read', error.message);
  }
};

/**
 * Mark all as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return sendSuccess(res, { message: 'All notifications marked as read' });
  } catch (error) {
    return sendError(res, 500, 'Failed to mark all as read', error.message);
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return sendError(res, 404, 'Notification not found');
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    await Notification.findByIdAndDelete(req.params.id);

    return sendSuccess(res, { message: 'Notification deleted successfully' });
  } catch (error) {
    return sendError(res, 500, 'Failed to delete notification', error.message);
  }
};


