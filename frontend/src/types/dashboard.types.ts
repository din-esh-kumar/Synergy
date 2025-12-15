// src/types/dashboard.types.ts

import { Meeting } from './meetings.types';

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus | string;
  priority: TaskPriority | string;
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

  // Extra fields used in Dashboard.tsx
  myTasksCount?: number;
  openIssuesCount?: number;
  upcomingMeetingsCount?: number;
  activeProjectsCount?: number;
  pendingApprovals?: number;
}

export interface DashboardWidget {
  title: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: number;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface RoleFeature {
  role: UserRole;
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

// Shape returned by backend when you use /dashboard (not /dashboard/stats)
export interface DashboardApiResponse {
  success: boolean;
  message?: string;
  data: DashboardData;
}

export interface Activity {
  _id: string;
  activityType: 'task' | 'meeting' | 'issue';
  title?: string;
  status?: string;
  updatedAt: string;
  [key: string]: any;
}
