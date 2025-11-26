import api from './api';

export interface DashboardStats {
  totalUsers?: number;
  activeProjects?: number;
  pendingTasks?: number;
  upcomingMeetings?: number;
  totalTeams?: number;
  completedTasks?: number;
  [key: string]: any;
}

export const dashboardService = {
  // General dashboard stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data || {};
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {};
    }
  },

  // Admin stats
  getAdminStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get('/admin/stats');
      return response.data || {};
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return {};
    }
  },

  // Manager stats
  getManagerStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get('/manager/stats');
      return response.data || {};
    } catch (error) {
      console.error('Error fetching manager stats:', error);
      return {};
    }
  },

  // Employee stats
  getEmployeeStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get('/employee/stats');
      return response.data || {};
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      return {};
    }
  },

  // Recent activity
  getRecentActivity: async (limit = 10) => {
    try {
      const response = await api.get(`/dashboard/activity?limit=${limit}`);
      return response.data?.activities || [];
    } catch (error) {
      console.error('Error fetching activity:', error);
      return [];
    }
  },

  // Projects
  getProjects: async () => {
    try {
      const response = await api.get('/projects');
      return response.data?.projects || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },

  // Tasks
  getTasks: async () => {
    try {
      const response = await api.get('/tasks');
      return response.data?.tasks || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  // Users
  getUsers: async () => {
    try {
      const response = await api.get('/users');
      return response.data?.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Teams
  getTeams: async () => {
    try {
      const response = await api.get('/teams');
      return response.data?.teams || [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  },
};

export default dashboardService;
