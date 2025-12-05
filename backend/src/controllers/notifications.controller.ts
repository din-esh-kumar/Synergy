import { Request, Response } from 'express';
import Notification from '../models/Notification.model';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../utils/notificationEngine';

export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { limit = 20, skip = 0 } = req.query;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Notification.countDocuments({ userId });
    const unread = await Notification.countDocuments({ userId, read: false });

    res.json({
      notifications,
      total,
      unread,
      limit: Number(limit),
      skip: Number(skip),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

export async function markAsRead(req: Request, res: Response) {
  try {
    const { notificationId } = req.params;

    const notification = await markNotificationAsRead(notificationId);

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

export async function markAllAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    await markAllNotificationsAsRead(userId);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
}

export async function deleteNotification(req: Request, res: Response) {
  try {
    const { notificationId } = req.params;
    const userId = (req as any).userId;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
}
