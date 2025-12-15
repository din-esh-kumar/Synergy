// src/services/dashboard.service.ts
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

  // extras defaulted to 0
  myTasksCount: 0,
  openIssuesCount: 0,
  upcomingMeetingsCount: 0,
  activeProjectsCount: 0,
  pendingApprovals: 0,
};

export interface DashboardStatsApiResponse<TMeeting = any, TTask = any> {
  success?: boolean;
  stats?: DashboardStats;
  upcomingMeetings?: TMeeting[];
  recentTasks?: TTask[];
}

export interface NormalizedDashboardData<TMeeting = any, TTask = any> {
  success: boolean;
  stats: DashboardStats;
  upcomingMeetings: TMeeting[];
  recentTasks: TTask[];
}

const dashboardService = {
  getDashboardStats: async <
    TMeeting = any,
    TTask = any,
  >(): Promise<NormalizedDashboardData<TMeeting, TTask>> => {
    try {
      const response = await api.get<DashboardStatsApiResponse<TMeeting, TTask>>(
        '/dashboard/stats',
      );

      const data = response.data || {};
      const stats: DashboardStats = data.stats ?? emptyStats;

      return {
        success: data.success ?? true,
        stats,
        upcomingMeetings: data.upcomingMeetings ?? [],
        recentTasks: data.recentTasks ?? [],
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: false,
        stats: emptyStats,
        upcomingMeetings: [],
        recentTasks: [],
      };
    }
  },
};

export default dashboardService;
