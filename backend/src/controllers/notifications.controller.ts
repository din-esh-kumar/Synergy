import { Request, Response } from 'express';
import Notification from '../models/Notification.model';
import { 
  markNotificationAsRead, 
  // markAllNotificationsAsRead,  // no longer used here
  getNotificationStats,
  deleteOldNotifications 
} from '../utils/notificationEngine';

/**
 * Get all notifications for the current user
 */
export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { limit = 50, skip = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    const total = await Notification.countDocuments({ userId });
    const unread = await Notification.countDocuments({ userId, read: false });

    return res.json({
      success: true,
      data: {
        notifications,
        total,
        unread,
        limit: Number(limit),
        skip: Number(skip),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
}

/**
 * Get notification statistics
 */
export async function getStats(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const stats = await getNotificationStats(userId);
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('❌ Error getting notification stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get notification stats',
    });
  }
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(req: Request, res: Response) {
  try {
    const { notificationId } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: 'Unauthorized - not your notification' });
    }

    const updated = await markNotificationAsRead(notificationId);
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await Notification.updateMany(
      { userId, read: { $ne: true } },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      },
    );

    return res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
    });
  }
}

/**
 * Delete a single notification
 */
export async function deleteNotification(req: Request, res: Response) {
  try {
    const { notificationId } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: 'Unauthorized - not your notification' });
    }

    await Notification.findByIdAndDelete(notificationId);
    return res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
    });
  }
}

/**
 * Clear all notifications for the current user
 */
export async function clearAllNotifications(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await Notification.deleteMany({ userId });
    return res.json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear notifications',
    });
  }
}

/**
 * Cleanup old notifications (admin only)
 */
export async function cleanupOldNotifications(req: Request, res: Response) {
  try {
    const { daysOld = 90 } = req.body;

    const userRole = (req as any).userRole;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await deleteOldNotifications(daysOld);
    return res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        message: `Deleted notifications older than ${daysOld} days`,
      },
    });
  } catch (error) {
    console.error('❌ Error cleaning up notifications:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cleanup notifications',
    });
  }
}
