import React, { useState } from 'react';
import { Meeting, User } from '../types/meetings.types';

interface Props {
  meeting?: Meeting;
  onSubmit: (data: Meeting) => void;
  onCancel: () => void;
}

const MeetingForm: React.FC<Props> = ({ meeting, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Meeting>({
    _id: meeting?._id || '',
    title: meeting?.title || '',
    description: meeting?.description || '',
    startTime: meeting?.startTime || new Date().toISOString().slice(0, 16),
    endTime: meeting?.endTime || new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    attendees: meeting?.attendees || [] as User[], // ✅ ensure correct type
    organizer: meeting?.organizer || '',
    status: meeting?.status || 'pending', // ✅ add 'pending' to MeetingStatus type
    createdAt: meeting?.createdAt || new Date().toISOString(),
    updatedAt: meeting?.updatedAt || new Date().toISOString(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-2">Meeting Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Enter meeting title"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Enter meeting description"
          rows={3}
        />
      </div>

      {/* Start & End Time */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Start Time *</label>
          <input
            type="datetime-local"
            value={formData.startTime?.slice(0, 16)}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">End Time *</label>
          <input
            type="datetime-local"
            value={formData.endTime?.slice(0, 16)}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            required
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
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
