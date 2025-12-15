export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'INTERN';
  avatar?: string;
  avatarUrl?: string;
}

export interface Attendee {
  _id: string;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
}

// Single Meeting interface - supports both string IDs and Attendee objects
export interface Meeting {
  _id?: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO string from API
  endTime: string;   // ISO string from API
  attendees?: string[]; // User IDs
  invitedUsers?: (Attendee | string)[];
  organizer?: string;
  organiserName?: string;
  // frontend status used for filters / UI
  status?: 'upcoming' | 'ongoing' | 'completed' | 'scheduled' | 'live' | 'ended';
  // backend mode: how meeting was created
  mode?: 'scheduled' | 'instant' | 'link-only';
  joinLink?: string;
  googleEventId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Payload types (same as Meeting, just for clarity in API calls)
export type CreateMeetingPayload = Omit<
  Meeting,
  '_id' | 'createdAt' | 'updatedAt' | 'status'
>;

export type UpdateMeetingPayload = Partial<
  Omit<Meeting, '_id' | 'createdAt' | 'updatedAt'>
>;

// Filter types
export interface MeetingFilters {
  status?: 'upcoming' | 'ongoing' | 'completed' | 'scheduled' | 'live' | 'ended' | 'all';
  search?: string;
  organizer?: string;
  attendee?: string;
}

export interface DashboardStats {
  totalUsers?: number;
  activeProjects?: number;
  pendingTasks?: number;
  upcomingMeetings?: number;
  totalTeams?: number;
  teamMembers?: number;
  myTasks?: number;
  myProjects?: number;
  myMeetings?: number;
  teamProductivity?: number;
  [key: string]: any;
}

export interface DashboardData {
  stats: DashboardStats;
  recentTasks?: any[];
}
