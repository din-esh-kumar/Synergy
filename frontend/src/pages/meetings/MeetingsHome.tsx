import React, { useEffect, useState, useCallback } from 'react';
import { Calendar as CalendarIcon, Plus, Search } from 'lucide-react';
import meetingsService from '../../services/meetings.service';
import {
  Meeting,
  CreateMeetingPayload,
  UpdateMeetingPayload,
} from '../../types/meetings.types';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../components/common/Toast';
import MeetingForm from './MeetingForm';
import MeetingList from './MeetingList';
import MeetingCalendar from './MeetingCalendar';

type FilterStatus = 'all' | 'scheduled' | 'ongoing' | 'completed';

const MeetingsHome: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const safeDate = (value: string | Date | undefined): Date | null => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const fetchMeetings = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const data = await meetingsService.getMeetings();
      let userMeetings: Meeting[] = data;

      if (user.role !== 'ADMIN') {
        const uid = user._id;
        userMeetings = data.filter((m: Meeting) => {
          const organizer = m.organizer as unknown as string | { _id: string };
          const isOrganizer =
            typeof organizer === 'string'
              ? organizer === uid
              : organizer?._id === uid;

          const inAttendees = Array.isArray(m.attendees)
            ? (m.attendees as (string | { _id: string })[]).some((a) =>
                typeof a === 'string' ? a === uid : a._id === uid
              )
            : false;

          const inInvited = Array.isArray(m.invitedUsers)
            ? (m.invitedUsers as (string | { _id: string })[]).some((inv) =>
                typeof inv === 'string' ? inv === uid : inv._id === uid
              )
            : false;

          return isOrganizer || inAttendees || inInvited;
        });
      }

      setMeetings(userMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      showToast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMeetings();
    const interval = setInterval(fetchMeetings, 30000);
    return () => clearInterval(interval);
  }, [fetchMeetings]);

  useEffect(() => {
    let filtered = [...meetings];
    const now = new Date();

    if (filter === 'scheduled') {
      filtered = filtered.filter((m) => {
        const start = safeDate(m.startTime);
        return !!start && start > now;
      });
    } else if (filter === 'ongoing') {
      filtered = filtered.filter((m) => {
        const start = safeDate(m.startTime);
        const end = safeDate(m.endTime);
        return !!start && !!end && start <= now && end >= now;
      });
    } else if (filter === 'completed') {
      filtered = filtered.filter((m) => {
        const end = safeDate(m.endTime);
        return !!end && end < now;
      });
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title?.toLowerCase().includes(term) ||
          m.description?.toLowerCase().includes(term) ||
          m.location?.toLowerCase().includes(term)
      );
    }

    setFilteredMeetings(filtered);
  }, [meetings, filter, search]);

  const handleCreateMeeting = async (data: CreateMeetingPayload) => {
    try {
      const payload: CreateMeetingPayload = {
        ...data,
        organizer: user?._id || data.organizer,
        organiserName: user?.name || data.organiserName,
      };
      const created = await meetingsService.createMeeting(payload);
      if (created) {
        showToast.success('Meeting created successfully! 📅');
        setShowForm(false);
        setEditingMeeting(null);
        await fetchMeetings();
      }
    } catch (error: any) {
      console.error('Error creating meeting:', error?.response?.data || error);
      showToast.error(
        error?.response?.data?.message || 'Failed to create meeting'
      );
    }
  };

  const handleUpdateMeeting = async (data: CreateMeetingPayload) => {
    if (!editingMeeting?._id) return;
    try {
      const updatePayload: UpdateMeetingPayload = {
        ...data,
        organizer:
          typeof data.organizer === 'string'
            ? data.organizer
            : (data.organizer as any)?._id,
      };
      const updated = await meetingsService.updateMeeting(
        editingMeeting._id,
        updatePayload
      );
      if (updated) {
        showToast.success('Meeting updated successfully! ✏️');
        setEditingMeeting(null);
        setShowForm(false);
        await fetchMeetings();
      }
    } catch (error: any) {
      console.error('Error updating meeting:', error?.response?.data || error);
      showToast.error(
        error?.response?.data?.message || 'Failed to update meeting'
      );
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    try {
      const deleted = await meetingsService.deleteMeeting(id);
      if (deleted) {
        showToast.success('Meeting deleted successfully! 🗑️');
        await fetchMeetings();
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      showToast.error('Failed to delete meeting');
    }
  };

  const handleJoinMeeting = async (id: string) => {
    const meeting = meetings.find((m) => m._id === id);
    if (meeting?.joinLink) {
      window.open(meeting.joinLink, '_blank', 'noopener,noreferrer');
    }

    try {
      await meetingsService.joinMeeting(id);
      await fetchMeetings();
    } catch (error) {
      console.error('Error joining meeting:', error);
      showToast.error('Failed to join meeting');
    }
  };

  return (
    <div className="flex-1 px-6 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white">
          <CalendarIcon className="w-8 h-8 text-blue-600" />
          Meetings
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage your team meetings and schedules
        </p>
      </div>

      {/* View Toggle + New Meeting Button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Calendar View
          </button>
        </div>

        {/* New Meeting Button */}
        {user?.role !== 'EMPLOYEE' && !showForm && (
          <button
            onClick={() => {
              setEditingMeeting(null);
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all"
          >
            <Plus className="w-5 h-5" />
            New Meeting
          </button>
        )}
      </div>

      {/* Search + Filters Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-6">
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings..."
            className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'scheduled', 'ongoing', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <MeetingForm
            meeting={editingMeeting}
            onSubmit={
              editingMeeting ? handleUpdateMeeting : handleCreateMeeting
            }
            onCancel={() => {
              setShowForm(false);
              setEditingMeeting(null);
            }}
          />
        </div>
      )}

      {/* Content Area - List or Calendar */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        {loading ? (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            Loading meetings...
          </div>
        ) : filteredMeetings.length > 0 ? (
          viewMode === 'list' ? (
            <div className="space-y-4">
              {filteredMeetings.map((meeting) => (
                <MeetingList
                  key={meeting._id}
                  meeting={meeting}
                  currentUserId={user?._id}
                  currentUserRole={user?.role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE'}
                  onEdit={() => {
                    setEditingMeeting(meeting);
                    setShowForm(true);
                  }}
                  onDelete={() =>
                    meeting._id && handleDeleteMeeting(meeting._id)
                  }
                  onJoin={() =>
                    meeting._id && handleJoinMeeting(meeting._id)
                  }
                />
              ))}
            </div>
          ) : (
            <MeetingCalendar meetings={filteredMeetings} />
          )
        ) : (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              No meetings found
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
              {filter === 'all'
                ? 'Create a new meeting to get started.'
                : `No ${filter} meetings right now.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingsHome;
