export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Meeting {
  _id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingLink?: string;
  organizer: User;
  attendees: User[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  reminder?: number;
  createdAt: string;
  updatedAt: string;
  duration?: number;
}

export interface CreateMeetingPayload {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingLink?: string;
  attendees: string[];
  reminder?: number;
}

export interface MeetingFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}
