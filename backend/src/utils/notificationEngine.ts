import Notification from '../models/Notification.model';
import { emitNotification } from './socketEmitter';

export interface NotificationPayload {
  userId?: string;
  userIds?: string[];
  type: 'team' | 'project' | 'task' | 'meeting' | 'issue' | 'chat' | 'system';
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'commented' | 'mentioned' | 'completed';
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  icon?: string;
  color?: string;
  actionUrl?: string;
}

export async function createNotification(payload: NotificationPayload) {
  try {
    const userIds = payload.userIds || (payload.userId ? [payload.userId] : []);

    const notifications = await Notification.insertMany(
      userIds.map((userId) => ({
        userId,
        type: payload.type,
        action: payload.action,
        title: payload.title,
        message: payload.message,
        relatedEntity: {
          entityType: payload.entityType,
          entityId: payload.entityId,
        },
        icon: payload.icon,
        color: payload.color,
        actionUrl: payload.actionUrl,
      }))
    );

    // Emit real-time notification via socket
    notifications.forEach((notificationDoc) => {
         emitNotification(notificationDoc.userId.toString(), {
           ...payload,
         _id: notificationDoc._id.toString(),
        });
     });


    return notifications;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId: string) {
  return Notification.findByIdAndUpdate(
    notificationId,
    {
      read: true,
      readAt: new Date(),
    },
    { new: true }
  );
}

export async function markAllNotificationsAsRead(userId: string) {
  return Notification.updateMany(
    { userId, read: false },
    {
      read: true,
      readAt: new Date(),
    }
  );
}
