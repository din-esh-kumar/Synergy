// frontend/src/pages/meetings/MeetingsHome.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Zap,
  Link as LinkIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

type FilterStatus = 'all' | 'scheduled' | 'ongoing' | 'completed' | 'live' | 'ended';

const MeetingsHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  // Popup state
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const safeDate = (value: string | Date | undefined): Date | null => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
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
            typeof organizer === 'string' ? organizer === uid : organizer?._id === uid;

          const inAttendees = Array.isArray(m.attendees)
            ? (m.attendees as (string | { _id: string })[]).some((a) =>
              typeof a === 'string' ? a === uid : a._id === uid,
            )
            : false;

          const inInvited = Array.isArray(m.invitedUsers)
            ? (m.invitedUsers as (string | { _id: string })[]).some((inv) =>
              typeof inv === 'string' ? inv === uid : inv._id === uid,
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

    if (filter !== 'all') {
      if (filter === 'scheduled') {
        filtered = filtered.filter((m) => {
          const start = safeDate(m.startTime);
          return !!start && start > now;
        });
      } else if (filter === 'ongoing' || filter === 'live') {
        filtered = filtered.filter((m) => {
          const start = safeDate(m.startTime);
          const end = safeDate(m.endTime);
          return !!start && !!end && start <= now && end >= now;
        });
      } else if (filter === 'completed' || filter === 'ended') {
        filtered = filtered.filter((m) => {
          const end = safeDate(m.endTime);
          return !!end && end < now;
        });
      }
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title?.toLowerCase().includes(term) ||
          m.description?.toLowerCase().includes(term) ||
          m.location?.toLowerCase().includes(term),
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
      showToast.error(error?.response?.data?.message || 'Failed to create meeting');
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
        updatePayload,
      );
      if (updated) {
        showToast.success('Meeting updated successfully! ✏️');
        setEditingMeeting(null);
        setShowForm(false);
        await fetchMeetings();
      }
    } catch (error: any) {
      console.error('Error updating meeting:', error?.response?.data || error);
      showToast.error(error?.response?.data?.message || 'Failed to update meeting');
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

  const openJoinLink = (joinLink: string) => {
    if (joinLink.startsWith('https://meet.google.com')) {
      window.open(joinLink, '_blank', 'noopener,noreferrer');
      return;
    }
    if (joinLink.startsWith(window.location.origin)) {
      const path = joinLink.replace(window.location.origin, '');
      navigate(path);
    } else if (joinLink.startsWith('/')) {
      navigate(joinLink);
    } else {
      window.open(joinLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleJoinMeeting = async (id: string) => {
    const meeting = meetings.find((m) => m._id === id);

    if (meeting?.joinLink) {
      openJoinLink(meeting.joinLink);
    } else if (meeting?._id) {
      navigate(`/meetings/${meeting._id}`);
    }

    try {
      await meetingsService.joinMeeting(id);
      await fetchMeetings();
    } catch (error) {
      console.error('Error joining meeting:', error);
      showToast.error('Failed to join meeting');
    }
  };

  const handleCalendarSelect = (meeting: Meeting) => {
    if (meeting._id) {
      handleJoinMeeting(meeting._id);
    }
  };

  const filterButtons: FilterStatus[] = ['all', 'scheduled', 'ongoing', 'completed'];

  const handleCopyCreatedLink = async () => {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast.error('Unable to copy, please copy manually');
    }
  };

  const handleClosePopup = () => {
    setCreatedLink(null);
    setCopied(false);
  };

  return (
    <div className="flex-1 px-6 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white">
          <CalendarIcon className="w-8 h-8 text-blue-600" />
          Meetings
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Manage your team meetings and schedules
        </p>
      </div>

      {/* View Toggle + New Meeting Button */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'calendar'
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
          >
            Calendar View
          </button>
        </div>

        {user?.role !== 'EMPLOYEE' && !showForm && (
          <div className="relative">
            <button
              onClick={() => setNewMenuOpen((v) => !v)}
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white transition-all hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="h-5 w-5" />
              New Meeting
            </button>

            {newMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-xl dark:border-slate-700 dark:bg-slate-800 z-20">
                {/* Start instant meeting */}
                <button
                  type="button"
                  onClick={async () => {
                    setNewMenuOpen(false);
                    try {
                      const meeting = await meetingsService.createInstantMeeting();
                      showToast.success('Instant meeting started');
                      if (meeting.joinLink) {
                        openJoinLink(meeting.joinLink);
                      } else if (meeting._id) {
                        navigate(`/meetings/${meeting._id}`);
                      }
                      await fetchMeetings();
                    } catch (e) {
                      console.error(e);
                      showToast.error('Failed to start instant meeting');
                    }
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Start an instant meeting</span>
                    <span className="text-xs text-slate-500">
                      Create a room and join now
                    </span>
                  </div>
                </button>

                {/* Create link for later */}
                <button
                  type="button"
                  onClick={async () => {
                    setNewMenuOpen(false);
                    try {
                      const meeting = await meetingsService.createLinkOnlyMeeting();
                      if (meeting?.joinLink) {
                        setCreatedLink(meeting.joinLink);
                      } else {
                        showToast.error('No link returned from server');
                      }
                      await fetchMeetings();
                    } catch (e) {
                      console.error(e);
                      showToast.error('Failed to create meeting link');
                    }
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Create a meeting for later</span>
                    <span className="text-xs text-slate-500">
                      Generate a link to share
                    </span>
                  </div>
                </button>

                {/* Schedule in calendar */}
                <button
                  type="button"
                  onClick={() => {
                    setNewMenuOpen(false);
                    setEditingMeeting(null);
                    setShowForm(true);
                  }}
                  className="flex w-full items-center gap-3 border-t border-slate-200 px-4 py-3 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-900/30">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Schedule in calendar</span>
                    <span className="text-xs text-slate-500">
                      Choose date, time and guests
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search + Filters Section */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-900 outline-none transition-colors focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filterButtons.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${filter === f
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
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

      {/* Content Area - List or Calendar */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="py-8 text-center text-slate-600 dark:text-slate-400">
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
                  currentUserRole={user?.role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'INTERN'}
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
            <MeetingCalendar
              meetings={filteredMeetings}
              onSelectMeeting={handleCalendarSelect}
            />
          )
        ) : (
          <div className="py-12 text-center">
            <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="font-medium text-slate-600 dark:text-slate-400">
              No meetings found
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
              {filter === 'all'
                ? 'Create a new meeting to get started.'
                : `No ${filter} meetings right now.`}
            </p>
          </div>
        )}
      </div>

      {/* Popup card for "Create link for later" */}
      {createdLink && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/40">
                <LinkIcon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Here&apos;s your joining link
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Share this link with people you want to meet. You can reuse it later as
                  well.
                </p>
              </div>
            </div>

            <div className="mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <span className="flex-1 break-all">{createdLink}</span>
              <button
                type="button"
                onClick={handleCopyCreatedLink}
                className={`rounded-lg px-3 py-1 text-xs font-semibold text-white transition-colors ${copied
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Tip: You can paste this into calendar invites, chats, or emails.</span>
              <button
                type="button"
                onClick={handleClosePopup}
                className="rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsHome;
