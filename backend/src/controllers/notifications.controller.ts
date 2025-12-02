import { Request, Response, NextFunction } from 'express';
import { Notification } from '../config/Notification.model';  // or default import based on your file

const getAuthUserId = (req: Request): string | undefined => {
  const u = (req as any).user;
  if (!u) return undefined;
  return u._id?.toString?.() || u.id || u.userId;
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const count = await Notification.countDocuments({ userId, read: false });
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
};

export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getAuthUserId(req);
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await Notification.updateOne(
      { _id: id, userId },
      { $set: { read: true } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getAuthUserId(req);
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await Notification.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
