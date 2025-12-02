import React, { useState, useEffect } from 'react';
import { Meeting, CreateMeetingPayload } from '../../types/meetings.types';
import { Trash2 } from 'lucide-react';
import userService from '../../services/user.service';

interface Props {
  meeting?: Meeting | null; // Accept null as well
  onSubmit: (data: CreateMeetingPayload) => void;
  onCancel: () => void;
}

const MeetingForm: React.FC<Props> = ({ meeting, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateMeetingPayload>(
    meeting
      ? {
          title: meeting.title,
          description: meeting.description || '',
          location: meeting.location || '',
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          attendees: meeting.attendees || [],
        }
      : {
          title: '',
          description: '',
          location: '',
          startTime: new Date().toISOString().slice(0, 16),
          endTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
          attendees: [],
        }
  );

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(meeting?.attendees || []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      setAllUsers(response || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddAttendee = (userId: string) => {
    if (!selectedUsers.includes(userId)) {
      const newSelected = [...selectedUsers, userId];
      setSelectedUsers(newSelected);
      setFormData({ ...formData, attendees: newSelected });
    }
  };

  const handleRemoveAttendee = (userId: string) => {
    const newSelected = selectedUsers.filter((id) => id !== userId);
    setSelectedUsers(newSelected);
    setFormData({ ...formData, attendees: newSelected });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    onSubmit(formData);
  };

  const selectedUserDetails = allUsers.filter((u) => selectedUsers.includes(u._id));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[90vh] overflow-y-auto">
      <div>
        <label className="block text-sm font-medium mb-2">Meeting Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2.5 bg-slate-700 dark:bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-white"
          placeholder="Enter meeting title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2.5 bg-slate-700 dark:bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-white"
          placeholder="Enter meeting description"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Location</label>
        <input
          type="text"
          value={formData.location || ''}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-4 py-2.5 bg-slate-700 dark:bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-white"
          placeholder="Enter meeting location or video call link"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Start Time *</label>
          <input
            type="datetime-local"
            value={formData.startTime?.toString().slice(0, 16)}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-700 dark:bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">End Time *</label>
          <input
            type="datetime-local"
            value={formData.endTime?.toString().slice(0, 16)}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-700 dark:bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-white"
            required
          />
        </div>
      </div>

      {/* Invite Attendees */}
      <div>
        <label className="block text-sm font-medium mb-2">Invite Attendees</label>
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleAddAttendee(e.target.value);
              e.target.value = '';
            }
          }}
          className="w-full px-4 py-2.5 bg-slate-700 dark:bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-white"
        >
          <option value="">Select user to invite...</option>
          {allUsers
            .filter((u) => !selectedUsers.includes(u._id))
            .map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.role})
              </option>
            ))}
        </select>
      </div>

      {/* Selected Attendees */}
      {selectedUserDetails.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Invited Attendees ({selectedUserDetails.length})
          </label>
          <div className="space-y-2">
            {selectedUserDetails.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 bg-slate-700 dark:bg-slate-700 border border-slate-600 rounded-lg"
              >
                <span className="text-sm">{user.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttendee(user._id)}
                  className="p-1 hover:bg-red-600/20 rounded transition-colors"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-slate-600">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 bg-slate-700 dark:bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          {meeting ? 'Update Meeting' : 'Create Meeting'}
        </button>
      </div>
    </form>
  );
};

export default MeetingForm;
