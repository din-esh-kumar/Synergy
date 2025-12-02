import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Plus, Search } from 'lucide-react';
import meetingsService from '../../services/meetings.service';
import { Meeting, CreateMeetingPayload, UpdateMeetingPayload } from '../../types/meetings.types';
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
    setLoading(true);
    try {
      const data = await meetingsService.getMeetings();

      let userMeetings = data;

      // ADMIN sees all meetings; others see only those they are related to
      if (user?.role !== 'ADMIN') {
        const uid = user?._id || '';
        userMeetings = data.filter((m) => {
          const isOrganizer = m.organizer === uid;
          const inAttendees = m.attendees?.includes(uid);
          const inInvited =
            Array.isArray(m.invitedUsers) &&
            m.invitedUsers.some((inv: any) =>
              typeof inv === 'string' ? inv === uid : inv._id === uid
            );
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
  }, [user?._id, user?.role]);

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
      const created = await meetingsService.createMeeting(data);
      if (created) {
        showToast.success('Meeting created successfully! 📅');
        setShowForm(false);
        await fetchMeetings();
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      showToast.error('Failed to create meeting');
    }
  };

  const handleUpdateMeeting = async (data: CreateMeetingPayload) => {
    if (!editingMeeting?._id) return;
    try {
      const updatePayload: UpdateMeetingPayload = data;
      const updated = await meetingsService.updateMeeting(editingMeeting._id, updatePayload);
      if (updated) {
        showToast.success('Meeting updated successfully! ✏️');
        setEditingMeeting(null);
        setShowForm(false);
        await fetchMeetings();
      }
    } catch (error) {
      console.error('Error updating meeting:', error);
      showToast.error('Failed to update meeting');
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
    try {
      const joined = await meetingsService.joinMeeting(id);
      if (joined) {
        showToast.success('Joined meeting! 🎉');
        await fetchMeetings();
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      showToast.error('Failed to join meeting');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 dark:bg-slate-950 text-white dark:text-white p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2 mb-2">
            <Calendar size={32} className="text-blue-400" />
            Meetings
          </h1>
          <p className="text-gray-400">Manage your team meetings and schedules</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-8 bg-slate-800 dark:bg-slate-800 rounded-xl border border-slate-700 p-6">
          <MeetingForm
            meeting={editingMeeting}
            onSubmit={editingMeeting ? handleUpdateMeeting : handleCreateMeeting}
            onCancel={() => {
              setShowForm(false);
              setEditingMeeting(null);
            }}
          />
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => {
            setEditingMeeting(null);
            setShowForm(true);
          }}
          className="mb-6 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          New Meeting
        </button>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 dark:bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'scheduled', 'ongoing', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 dark:bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading meetings...</p>
        </div>
      ) : filteredMeetings.length > 0 ? (
        viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredMeetings.map((meeting) => (
              <MeetingList
                key={meeting._id}
                meeting={meeting}
                currentUserId={user?._id}
                onEdit={() => {
                  setEditingMeeting(meeting);
                  setShowForm(true);
                }}
                onDelete={() => meeting._id && handleDeleteMeeting(meeting._id)}
                onJoin={() => meeting._id && handleJoinMeeting(meeting._id)}
              />
            ))}
          </div>
        ) : (
          <MeetingCalendar meetings={filteredMeetings} />
        )
      ) : (
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-gray-400 text-lg">No meetings found</p>
          <p className="text-gray-500 text-sm mt-2">
            {filter === 'all'
              ? 'Create a new meeting to get started'
              : `No ${filter} meetings`}
          </p>
        </div>
      )}
    </div>
  );
};

export default MeetingsHome;
