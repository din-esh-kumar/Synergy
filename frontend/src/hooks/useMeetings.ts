import { useState, useCallback } from 'react';
import { meetingsService } from '../services/meetings.service';
import { Meeting, CreateMeetingPayload, MeetingFilters } from '../types/meetings.types';

export const useMeetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------- FETCH MEETINGS ----------------
  const fetchMeetings = useCallback(async (filters?: MeetingFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await meetingsService.getMeetings(filters || {});
      setMeetings(data);
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch meetings';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------- CREATE MEETING ----------------
  const createMeeting = useCallback(async (payload: CreateMeetingPayload) => {
    setLoading(true);
    setError(null);
    try {
      const newMeeting: Meeting = await meetingsService.createMeeting(payload);
      setMeetings((prev) => [...prev, newMeeting]);
      return newMeeting;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create meeting';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------- UPDATE MEETING ----------------
  const updateMeeting = useCallback(
    async (id: string, payload: Partial<CreateMeetingPayload>) => {
      setLoading(true);
      setError(null);
      try {
        const updated: Meeting = await meetingsService.updateMeeting(id, payload);
        setMeetings((prev) =>
          prev.map((m) => (m._id === id ? updated : m))
        );
        return updated;
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to update meeting';
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ---------------- DELETE MEETING ----------------
  const deleteMeeting = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await meetingsService.deleteMeeting(id);
      setMeetings((prev) => prev.filter((m) => m._id !== id));
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete meeting';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------- MONTHLY MEETINGS ----------------
  const getMonthlyMeetings = useCallback(async (year: number, month: number) => {
    setLoading(true);
    setError(null);

    try {
      const data = await meetingsService.getMonthlyMeetings(year, month);
      setMeetings(data);
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch monthly meetings';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    meetings,
    loading,
    error,
    fetchMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    getMonthlyMeetings,
  };
};
