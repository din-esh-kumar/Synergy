export type NotificationType =
  | 'meeting'
  | 'meetinginvite'
  | 'meetingupdate'
  | 'meetingcanceled'
  | 'meetingreminder'
  | 'task'
  | 'project'
  | 'issue'
  | 'message'
  | 'teaminvite'
  | 'fileshared'
  | 'call'
  | 'system'
  | 'update'
  | 'approval';

export interface NotificationData {
  meetingId?: string;
  taskId?: string;
  projectId?: string;
  issueId?: string;
  teamId?: string;
  chatId?: string;
  messageId?: string;
  meetingTitle?: string;
  senderName?: string;
  fileName?: string;
  callLink?: string;
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
  senderId?: string;   // ✅ CRITICAL FIX
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
}
