export interface User {
  _id: string;
  name: string;
  email: string;
}

export type MeetingStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'pending';

export interface Meeting {
  _id?: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  attendees: User[]; // Full user objects
  organizer?: string;
  status?: MeetingStatus;
  createdAt?: string;
  updatedAt?: string;
  joinLink?: string; // Added this so your component can use it
}

export interface CreateMeetingPayload {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingLink?: string; // optional meeting link
  attendees: string[]; // just user IDs for creation
  reminder?: number;
}

export interface MeetingFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}
