import { useState, useCallback, useEffect } from 'react';
import {
  Meeting,
  CreateMeetingPayload,
  UpdateMeetingPayload,
  MeetingFilters,
  Attendee,
} from '../types/meetings.types';
import meetingsService from '../services/meetings.service';
import { showToast } from '../components/common/Toast';

// helper – works for string ids or Attendee objects
const getAttendeeId = (attendee: Attendee | string): string => {
  if (typeof attendee === 'string') {
    return attendee;
  }
  return attendee._id;
};

interface UseMeetingsReturn {
  meetings: Meeting[];
  filteredMeetings: Meeting[];
  loading: boolean;
  error: string | null;
  filter: MeetingFilters;
  setFilter: (filter: MeetingFilters) => void;
  createMeeting: (data: CreateMeetingPayload) => Promise<boolean>;
  updateMeeting: (id: string, data: UpdateMeetingPayload) => Promise<boolean>;
  deleteMeeting: (id: string) => Promise<boolean>;
  joinMeeting: (id: string) => Promise<boolean>;
  leaveMeeting: (id: string) => Promise<boolean>;
  inviteUsers: (meetingId: string, userIds: string[]) => Promise<boolean>;
  fetchMeetings: () => Promise<void>;
  getMeetingById: (id: string) => Meeting | undefined;
}

export const useMeetings = (userId?: string): UseMeetingsReturn => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MeetingFilters>({ status: 'all' });

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await meetingsService.getMeetings();

      const userMeetings = userId
        ? data.filter((m) => {
            if (m.organizer === userId) return true;
            if (m.attendees?.includes(userId)) return true;
            if (m.invitedUsers && m.invitedUsers.length > 0) {
              return m.invitedUsers.some((inv) => getAttendeeId(inv) === userId);
            }
            return false;
          })
        : data;

      setMeetings(userMeetings);
      setError(null);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || 'Failed to fetch meetings';
      setError(errorMsg);
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let filtered = [...meetings];
    const now = new Date();

    if (filter.status && filter.status !== 'all') {
      if (filter.status === 'scheduled' || filter.status === 'upcoming') {
        filtered = filtered.filter((m) => new Date(m.startTime) > now);
      } else if (filter.status === 'ongoing') {
        filtered = filtered.filter((m) => {
          const start = new Date(m.startTime);
          const end = new Date(m.endTime);
          return start <= now && end >= now;
        });
      } else if (filter.status === 'completed') {
        filtered = filtered.filter((m) => new Date(m.endTime) < now);
      }
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title?.toLowerCase().includes(searchLower) ||
          m.description?.toLowerCase().includes(searchLower) ||
          m.location?.toLowerCase().includes(searchLower),
      );
    }

    if (filter.organizer) {
      filtered = filtered.filter((m) => m.organizer === filter.organizer);
    }

    if (filter.attendee) {
      filtered = filtered.filter((m) =>
        m.attendees?.includes(filter.attendee!),
      );
    }

    setFilteredMeetings(filtered);
  }, [meetings, filter]);

  const createMeeting = useCallback(
    async (data: CreateMeetingPayload): Promise<boolean> => {
      try {
        const created = await meetingsService.createMeeting(data);
        if (created) {
          showToast.success('Meeting created successfully! 📅');
          await fetchMeetings();
          return true;
        }
        return false;
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message || 'Failed to create meeting';
        setError(errorMsg);
        showToast.error(errorMsg);
        return false;
      }
    },
    [fetchMeetings],
  );

  const updateMeeting = useCallback(
    async (
      id: string,
      data: UpdateMeetingPayload,
    ): Promise<boolean> => {
      try {
        const updated = await meetingsService.updateMeeting(id, data);
        if (updated) {
          showToast.success('Meeting updated successfully! ✏️');
          await fetchMeetings();
          return true;
        }
        return false;
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message || 'Failed to update meeting';
        setError(errorMsg);
        showToast.error(errorMsg);
        return false;
      }
    },
    [fetchMeetings],
  );

  const deleteMeeting = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const deleted = await meetingsService.deleteMeeting(id);
        if (deleted) {
          showToast.success('Meeting deleted successfully! 🗑️');
          await fetchMeetings();
          return true;
        }
        return false;
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message || 'Failed to delete meeting';
        setError(errorMsg);
        showToast.error(errorMsg);
        return false;
      }
    },
    [fetchMeetings],
  );

  const joinMeeting = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const joined = await meetingsService.joinMeeting(id);
        if (joined) {
          showToast.success('Joined meeting! 🎉');
          await fetchMeetings();
          return true;
        }
        return false;
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message || 'Failed to join meeting';
        setError(errorMsg);
        showToast.error(errorMsg);
        return false;
      }
    },
    [fetchMeetings],
  );

  const leaveMeeting = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const left = await meetingsService.leaveMeeting(id);
        if (left) {
          showToast.success('Left meeting');
          await fetchMeetings();
          return true;
        }
        return false;
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message || 'Failed to leave meeting';
        setError(errorMsg);
        showToast.error(errorMsg);
        return false;
      }
    },
    [fetchMeetings],
  );

  const inviteUsers = useCallback(
    async (
      meetingId: string,
      userIds: string[],
    ): Promise<boolean> => {
      try {
        const invited = await meetingsService.inviteUsers(meetingId, userIds);
        if (invited) {
          showToast.success(`Invited ${userIds.length} user(s)! 📧`);
          await fetchMeetings();
          return true;
        }
        return false;
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message || 'Failed to invite users';
        setError(errorMsg);
        showToast.error(errorMsg);
        return false;
      }
    },
    [fetchMeetings],
  );

  const getMeetingById = useCallback(
    (id: string): Meeting | undefined => {
      return meetings.find((m) => m._id === id);
    },
    [meetings],
  );

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return {
    meetings,
    filteredMeetings,
    loading,
    error,
    filter,
    setFilter,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    joinMeeting,
    leaveMeeting,
    inviteUsers,
    fetchMeetings,
    getMeetingById,
  };
};
