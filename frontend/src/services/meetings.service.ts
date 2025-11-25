import api from './api';
import { Meeting, CreateMeetingPayload, MeetingFilters } from '../types/meetings.types';

export const meetingsService = {
  // Create a new meeting
  createMeeting: async (data: CreateMeetingPayload): Promise<Meeting> => {
    const response = await api.post('/meetings', data);
    return response.data.meeting;
  },

  // Get all meetings with filters
  getMeetings: async (filters?: MeetingFilters): Promise<Meeting[]> => {
    const response = await api.get('/meetings', { params: filters });
    return response.data.meetings;
  },

  // Get single meeting
  getMeetingById: async (id: string): Promise<Meeting> => {
    const response = await api.get(`/meetings/${id}`);
    return response.data.meeting;
  },

  // Update meeting
  updateMeeting: async (id: string, data: Partial<CreateMeetingPayload>): Promise<Meeting> => {
    const response = await api.put(`/meetings/${id}`, data);
    return response.data.meeting;
  },

  // Delete meeting
  deleteMeeting: async (id: string): Promise<void> => {
    await api.delete(`/meetings/${id}`);
  },

  // Get upcoming meetings
  getUpcomingMeetings: async (limit?: number): Promise<Meeting[]> => {
    const response = await api.get('/meetings/upcoming', { params: { limit } });
    return response.data.meetings;
  },

  // Get monthly meetings for calendar
  getMonthlyMeetings: async (year: number, month: number): Promise<Meeting[]> => {
    const response = await api.get('/meetings/monthly', { 
      params: { year, month } 
    });
    return response.data.meetings;
  },
};
