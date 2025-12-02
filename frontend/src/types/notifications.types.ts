// src/types/notifications.types.ts
export type NotificationType =
  | 'meeting'
  | 'meetinginvite'
  | 'meetingupdate'
  | 'meetingcanceled'
  | 'meetingreminder'
  | 'task'
  | 'project'
  | 'system'
  | 'update'
  | 'approval';

export interface NotificationData {
  meetingId?: string;
  taskId?: string;
  projectId?: string;
  meetingTitle?: string;
  senderName?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  userId: string;
  senderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
}
