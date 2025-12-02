import api from './api';
import { Meeting, MeetingFilters, CreateMeetingPayload } from '../types/meetings.types';

export const meetingsService = {

  // ---------------- GET ALL MEETINGS (WITH FILTERS) ----------------
  getMeetings: async (filters: MeetingFilters = {}): Promise<Meeting[]> => {
    try {
      const query = new URLSearchParams(filters as any).toString();
      const url = query ? `/meetings?${query}` : `/meetings`;

      const response = await api.get(url);
      return response.data?.meetings || [];
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }
  },

  // ---------------- GET MEETING BY ID ----------------
  getMeetingById: async (id: string): Promise<Meeting | null> => {
    try {
      const response = await api.get(`/meetings/${id}`);
      return response.data?.meeting || null;
    } catch (error) {
      console.error('Error fetching meeting:', error);
      return null;
    }
  },

  // ---------------- CREATE MEETING ----------------
  createMeeting: async (data: CreateMeetingPayload): Promise<Meeting | null> => {
    try {
      const response = await api.post('/meetings', data);
      return response.data?.meeting || null;
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  },

  // ---------------- UPDATE MEETING ----------------
  updateMeeting: async (id: string, data: Partial<CreateMeetingPayload>): Promise<Meeting | null> => {
    try {
      const response = await api.put(`/meetings/${id}`, data);
      return response.data?.meeting || null;
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw error;
    }
  },

  // ---------------- DELETE MEETING ----------------
  deleteMeeting: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/meetings/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting meeting:', error);
      return false;
    }
  },

  // ---------------- JOIN MEETING ----------------
  joinMeeting: async (id: string): Promise<boolean> => {
    try {
      const response = await api.post(`/meetings/${id}/join`, {});
      return response.status === 200;
    } catch (error) {
      console.error('Error joining meeting:', error);
      return false;
    }
  },

  // ---------------- LEAVE MEETING ----------------
  leaveMeeting: async (id: string): Promise<boolean> => {
    try {
      const response = await api.post(`/meetings/${id}/leave`, {});
      return response.status === 200;
    } catch (error) {
      console.error('Error leaving meeting:', error);
      return false;
    }
  },

  // ---------------- INVITE USERS ----------------
  inviteUsers: async (meetingId: string, userIds: string[]): Promise<boolean> => {
    try {
      const response = await api.post(`/meetings/${meetingId}/invite`, { userIds });
      return response.status === 200;
    } catch (error) {
      console.error('Error inviting users:', error);
      return false;
    }
  },

  // ---------------- INVITED MEETINGS ----------------
  getInvitedMeetings: async (): Promise<Meeting[]> => {
    try {
      const response = await api.get('/meetings/invited');
      return response.data?.meetings || [];
    } catch (error) {
      console.error('Error fetching invited meetings:', error);
      return [];
    }
  },

  // ---------------- MEETINGS BY STATUS ----------------
  getMeetingsByStatus: async (status: string): Promise<Meeting[]> => {
    try {
      const response = await api.get(`/meetings?status=${status}`);
      return response.data?.meetings || [];
    } catch (error) {
      console.error('Error fetching meetings by status:', error);
      return [];
    }
  },

  // ---------------- MONTHLY MEETINGS (ADDED) ----------------
  getMonthlyMeetings: async (year: number, month: number): Promise<Meeting[]> => {
    try {
      const response = await api.get(`/meetings/monthly?year=${year}&month=${month}`);
      return response.data?.meetings || [];
    } catch (error) {
      console.error('Error fetching monthly meetings:', error);
      return [];
    }
  },
};

export default meetingsService;
