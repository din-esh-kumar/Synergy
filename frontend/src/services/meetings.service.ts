import api from './api';
import { Meeting, CreateMeetingPayload, MeetingFilters } from '../types/meetings.types';

export const meetingsService = {
  getMeetings: async (filters?: MeetingFilters): Promise<Meeting[]> => {
    try {
      const response = await api.get('/meetings', { params: filters });
      return response.data?.meetings as Meeting[];
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }
  },

  getMeetingById: async (id: string): Promise<Meeting | null> => {
    try {
      const response = await api.get(`/meetings/${id}`);
      return response.data?.meeting as Meeting;
    } catch (error) {
      console.error('Error fetching meeting:', error);
      return null;
    }
  },

  createMeeting: async (data: CreateMeetingPayload): Promise<Meeting> => {
    const response = await api.post('/meetings', data);
    return response.data?.meeting as Meeting;
  },

  updateMeeting: async (id: string, data: Partial<CreateMeetingPayload>): Promise<Meeting> => {
    const response = await api.put(`/meetings/${id}`, data);
    return response.data?.meeting as Meeting;
  },

  deleteMeeting: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/meetings/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting meeting:', error);
      return false;
    }
  },

  joinMeeting: async (id: string): Promise<boolean> => {
    try {
      const response = await api.post(`/meetings/${id}/join`);
      return response.status === 200;
    } catch (error) {
      console.error('Error joining meeting:', error);
      return false;
    }
  },

  leaveMeeting: async (id: string): Promise<boolean> => {
    try {
      const response = await api.post(`/meetings/${id}/leave`);
      return response.status === 200;
    } catch (error) {
      console.error('Error leaving meeting:', error);
      return false;
    }
  },

  getMeetingsByStatus: async (status: string): Promise<Meeting[]> => {
    try {
      const response = await api.get('/meetings', { params: { status } });
      return response.data?.meetings as Meeting[];
    } catch (error) {
      console.error('Error fetching meetings by status:', error);
      return [];
    }
  },

  getMonthlyMeetings: async (year: number, month: number): Promise<Meeting[]> => {
    try {
      const response = await api.get(`/meetings/monthly`, { params: { year, month } });
      return response.data?.meetings as Meeting[];
    } catch (error) {
      console.error('Error fetching monthly meetings:', error);
      return [];
    }
  },
};

export default meetingsService;
