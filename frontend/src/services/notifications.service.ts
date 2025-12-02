// src/services/notifications.service.ts
import api from './api';
import {
  Notification,
  NotificationPayload,
} from '../types/notifications.types';

export const notificationsService = {
  // All notifications for current user
  async getNotifications(): Promise<Notification[]> {
    try {
      const res = await api.get('/notifications');
      return res.data?.notifications ?? [];
    } catch (error) {
      console.error('Error fetching notifications', error);
      return [];
    }
  },

  // Unread count
  async getUnreadCount(): Promise<number> {
    try {
      const res = await api.get('/notifications/unread-count');
      return res.data?.count ?? 0;
    } catch (error) {
      console.error('Error fetching unread count', error);
      return 0;
    }
  },

  // Mark single as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const res = await api.patch(`/notifications/${notificationId}/read`);
      return res.status === 200;
    } catch (error) {
      console.error('Error marking notification as read', error);
      return false;
    }
  },

  // Mark all as read
  async markAllAsRead(): Promise<boolean> {
    try {
      const res = await api.patch('/notifications/read-all');
      return res.status === 200;
    } catch (error) {
      console.error('Error marking all as read', error);
      return false;
    }
  },

  // Delete one
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      await api.delete(`/notifications/${notificationId}`);
      return true;
    } catch (error) {
      console.error('Error deleting notification', error);
      return false;
    }
  },

  // Generic create
  async sendNotification(
    data: NotificationPayload
  ): Promise<Notification | null> {
    try {
      const res = await api.post('/notifications', data);
      return res.data?.notification ?? null;
    } catch (error) {
      console.error('Error sending notification', error);
      return null;
    }
  },

  // Convenience helpers for meeting flows
  async sendMeetingInvite(
    userId: string,
    meetingId: string,
    meetingTitle: string,
    senderName: string
  ): Promise<boolean> {
    try {
      const payload: NotificationPayload = {
        userId,
        type: 'meetinginvite',
        title: 'New Meeting Invite',
        message: `${senderName} invited you to ${meetingTitle}`,
        data: { meetingId, meetingTitle, senderName },
      };
      const result = await this.sendNotification(payload);
      return result !== null;
    } catch (error) {
      console.error('Error sending meeting invite', error);
      return false;
    }
  },

  async sendMeetingUpdate(
    userId: string,
    meetingId: string,
    meetingTitle: string
  ): Promise<boolean> {
    try {
      const payload: NotificationPayload = {
        userId,
        type: 'meetingupdate',
        title: 'Meeting Updated',
        message: `${meetingTitle} has been updated`,
        data: { meetingId, meetingTitle },
      };
      const result = await this.sendNotification(payload);
      return result !== null;
    } catch (error) {
      console.error('Error sending meeting update', error);
      return false;
    }
  },

  async sendMeetingCanceled(
    userId: string,
    meetingId: string,
    meetingTitle: string
  ): Promise<boolean> {
    try {
      const payload: NotificationPayload = {
        userId,
        type: 'meetingcanceled',
        title: 'Meeting Canceled',
        message: `${meetingTitle} has been canceled`,
        data: { meetingId, meetingTitle },
      };
      const result = await this.sendNotification(payload);
      return result !== null;
    } catch (error) {
      console.error('Error sending meeting canceled notification', error);
      return false;
    }
  },

  async sendMeetingReminder(
    userId: string,
    meetingId: string,
    meetingTitle: string,
    minutesUntil: number
  ): Promise<boolean> {
    try {
      const payload: NotificationPayload = {
        userId,
        type: 'meetingreminder',
        title: 'Meeting Reminder',
        message: `${meetingTitle} starts in ${minutesUntil} minutes`,
        data: { meetingId, meetingTitle },
      };
      const result = await this.sendNotification(payload);
      return result !== null;
    } catch (error) {
      console.error('Error sending meeting reminder', error);
      return false;
    }
  },
};

export default notificationsService;
