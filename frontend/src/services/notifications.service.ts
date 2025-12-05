// src/services/notifications.service.ts
import api from './api';

export const notificationService = {
  // Get all notifications
  getNotifications: async (limit: number = 50, skip: number = 0) => {
    const res = await api.get('/notifications', {
      params: { limit, skip },
    });
    // Backend returns: { data: { notifications, total, unread, limit, skip }, success: true }
    return res.data;
  },

  // Mark a single notification as read
  markAsRead: (notificationId: string) => {
    return api.put(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    return api.put('/notifications/mark-all-read');
  },

  // Delete a single notification
  deleteNotification: (notificationId: string) => {
    return api.delete(`/notifications/${notificationId}`);
  },

  // Clear all notifications
  clearAllNotifications: () => {
    return api.delete('/notifications');
  },
};
