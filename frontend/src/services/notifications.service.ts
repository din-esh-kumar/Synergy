import api from './api';

export const notificationService = {
  getNotifications: async (limit?: number, skip?: number) => {
    return api.get('/notifications', {
      params: { limit, skip },
    });
  },

  markAsRead: async (notificationId: string) => {
    return api.put(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async () => {
    return api.put('/notifications/read-all');
  },

  deleteNotification: async (notificationId: string) => {
    return api.delete(`/notifications/${notificationId}`);
  },
};
