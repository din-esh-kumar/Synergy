import api from './api';
import { DashboardData, Activity } from '../types/dashboard.types';

export const dashboardService = {
  // Get dashboard statistics
  getDashboardStats: async (): Promise<DashboardData> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Get activity feed
  getActivityFeed: async (limit?: number): Promise<Activity[]> => {
    const response = await api.get('/dashboard/activity', { 
      params: { limit } 
    });
    return response.data.activities;
  },
};
