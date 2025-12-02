import { Meeting } from './meetings.types';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  project: {
    _id: string;
    name: string;
  };
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  };
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  totalMeetings: number;
  totalIssues: number;
  todaysMeetings: number;
  completedTasksThisWeek: number;
  tasksByStatus: Array<{ _id: string; count: number }>;
  projectsByStatus: Array<{ _id: string; count: number }>;
  // Optional extras used in UI widgets
  totalTeamMembers?: number;
  completedTasks?: number;
  ongoingProjects?: number;
}

export interface DashboardWidget {
  title: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: number;
}

export interface RoleFeature {
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAssignUsers: boolean;
  viewAll: boolean;
}

export interface DashboardData {
  stats: DashboardStats;
  upcomingMeetings: Meeting[];
  recentTasks: Task[];
}

export interface Activity {
  _id: string;
  activityType: 'task' | 'meeting' | 'issue';
  title?: string;
  status?: string;
  updatedAt: string;
  [key: string]: any;
}
