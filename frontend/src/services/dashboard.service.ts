import api from './api';
import { DashboardStats } from '../types/dashboard.types';

const emptyStats: DashboardStats = {
  totalProjects: 0,
  totalTasks: 0,
  totalMeetings: 0,
  totalIssues: 0,
  todaysMeetings: 0,
  completedTasksThisWeek: 0,
  tasksByStatus: [],
  projectsByStatus: [],
};

const dashboardService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get('/dashboard/stats');
      // Might be { stats: ... } or just the raw stats object
      return (response.data?.stats || response.data || emptyStats) as DashboardStats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return emptyStats;
    }
  }
  // You can add role-specific methods if needed, e.g. getAdminStats, etc.
};

export default dashboardService;
