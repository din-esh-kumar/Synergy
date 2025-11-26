import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Search } from 'lucide-react';
import { Meeting } from '../types/meetings.types';
import meetingsService from '../services/meetings.service';
import { showToast } from '../components/common/Toast';
import MeetingForm from './MeetingForm';
import MeetingList from './MeetingList';

const MeetingsHome: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'ongoing' | 'completed'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    let filtered = meetings;

    if (filter === 'scheduled') {
      filtered = filtered.filter(m => m.status === 'scheduled' || m.status === 'ongoing');
    } else if (filter === 'completed') {
      filtered = filtered.filter(m => m.status === 'completed');
    }

    if (search) {
      filtered = filtered.filter(m =>
        m.title?.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredMeetings(filtered);
  }, [meetings, filter, search]);

  const fetchMeetings = async () => {
    const data = await meetingsService.getMeetings();
    setMeetings(data);
  };

  const handleCreateMeeting = async (data: Meeting) => {
    try {
      await meetingsService.createMeeting({
        ...data,
        attendees: data.attendees.map(u => u._id!), // send IDs
      });
      showToast.success('Meeting created successfully! 📅');
      setShowForm(false);
      fetchMeetings();
    } catch (error) {
      showToast.error('Failed to create meeting');
    }
  };

  const handleUpdateMeeting = async (data: Meeting) => {
    if (!editingMeeting?._id) return;
    try {
      await meetingsService.updateMeeting(editingMeeting._id, {
        ...data,
        attendees: data.attendees.map(u => u._id!), // send IDs
      });
      showToast.success('Meeting updated successfully! ✏️');
      setEditingMeeting(null);
      setShowForm(false);
      fetchMeetings();
    } catch (error) {
      showToast.error('Failed to update meeting');
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await meetingsService.deleteMeeting(id);
      showToast.success('Meeting deleted successfully! 🗑️');
      setMeetings(meetings.filter(m => m._id !== id));
    } catch (error) {
      showToast.error('Failed to delete meeting');
    }
  };

  const handleJoinMeeting = async (id: string) => {
    try {
      await meetingsService.joinMeeting(id);
      showToast.success('Joined meeting! 🎉');
      fetchMeetings();
    } catch (error) {
      showToast.error('Failed to join meeting');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2 mb-2">
            <Calendar size={32} className="text-blue-400" />
            Meetings
          </h1>
          <p className="text-gray-400">Manage your team meetings and schedules</p>
        </div>
        <button
          onClick={() => {
            setEditingMeeting(null);
            setShowForm(!showForm);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          New Meeting
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="mb-8 bg-slate-800 rounded-xl border border-slate-700 p-6">
          <MeetingForm
            meeting={editingMeeting || undefined}
            onSubmit={editingMeeting ? handleUpdateMeeting : handleCreateMeeting}
            onCancel={() => {
              setShowForm(false);
              setEditingMeeting(null);
            }}
          />
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'scheduled', 'ongoing', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as 'all' | 'scheduled' | 'ongoing' | 'completed')}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Meetings List */}
      {filteredMeetings.length > 0 ? (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <MeetingList
              key={meeting._id}
              meeting={meeting}
              onEdit={() => {
                setEditingMeeting(meeting);
                setShowForm(true);
              }}
              onDelete={() => handleDeleteMeeting(meeting._id!)}
              onJoin={() => handleJoinMeeting(meeting._id!)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-gray-400 text-lg">No meetings found</p>
          <p className="text-gray-500 text-sm mt-2">Create a new meeting to get started</p>
        </div>
      )}
    </div>
  );
};

export default MeetingsHome;
