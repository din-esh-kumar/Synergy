import React, { useState, useEffect } from 'react';
import { Meeting, CreateMeetingPayload } from '../../types/meetings.types';
import { Trash2 } from 'lucide-react';
import userService from '../../services/user.service';

interface Props {
  meeting?: Meeting | null;
  onSubmit: (data: CreateMeetingPayload) => void;
  onCancel: () => void;
}

const MeetingForm: React.FC<Props> = ({ meeting, onSubmit, onCancel }) => {
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Normalise attendees from existing meeting -> string[]
  const initialAttendees: string[] = meeting?.attendees
    ? (meeting.attendees as string[])
    : [];

  const initialInvited: (string | any)[] = meeting?.invitedUsers || [];

  const initialInvitedIds: string[] = initialInvited.map((u: any) =>
    typeof u === 'string' ? u : u._id
  );

  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    initialAttendees.length ? initialAttendees : initialInvitedIds
  );

  const [formData, setFormData] = useState<CreateMeetingPayload>(
    meeting
      ? {
          title: meeting.title,
          description: meeting.description || '',
          location: meeting.location || '',
          joinLink: meeting.joinLink || '',
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          attendees: initialAttendees.length ? initialAttendees : initialInvitedIds,
          invitedUsers: initialInvitedIds,
          organizer: meeting.organizer,
          organiserName: meeting.organiserName,
        }
      : {
          title: '',
          description: '',
          location: '',
          joinLink: '',
          startTime: new Date().toISOString().slice(0, 16),
          endTime: new Date(Date.now() + 60 * 60 * 1000)
            .toISOString()
            .slice(0, 16),
          attendees: [],
          invitedUsers: [],
          organizer: undefined,
          organiserName: undefined,
        }
  );

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userService.getAllUsers();
        setAllUsers(response || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleAddAttendee = (userId: string) => {
    if (!selectedUsers.includes(userId)) {
      const newSelected = [...selectedUsers, userId];
      setSelectedUsers(newSelected);
      setFormData((prev) => ({
        ...prev,
        attendees: newSelected,
        invitedUsers: newSelected,
      }));
    }
  };

  const handleRemoveAttendee = (userId: string) => {
    const newSelected = selectedUsers.filter((id) => id !== userId);
    setSelectedUsers(newSelected);
    setFormData((prev) => ({
      ...prev,
      attendees: newSelected,
      invitedUsers: newSelected,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      alert('Start and End time are required');
      return;
    }

    // Final payload: force attendees & invitedUsers to be string[]
    const payload: CreateMeetingPayload = {
      ...formData,
      attendees: (formData.attendees || []).map((a: any) =>
        typeof a === 'string' ? a : a._id
      ),
      invitedUsers: (formData.invitedUsers || []).map((u: any) =>
        typeof u === 'string' ? u : u._id
      ),
    };

    onSubmit(payload);
  };

  const selectedUserDetails = allUsers.filter((u) =>
    selectedUsers.includes(u._id)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Meeting Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          className="w-full px-4 py-2.5 bg-white text-slate-900 dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Enter meeting title"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="w-full px-4 py-2.5 bg-white text-slate-900 dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Enter meeting description"
          rows={3}
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input
          type="text"
          value={formData.location || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, location: e.target.value }))
          }
          className="w-full px-4 py-2.5 bg-white text-slate-900 dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Enter meeting room or place"
        />
      </div>

      {/* Join link */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Join Link (video)
        </label>
        <input
          type="url"
          value={formData.joinLink || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, joinLink: e.target.value }))
          }
          className="w-full px-4 py-2.5 bg-white text-slate-900 dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Paste Zoom/Meet/Teams link"
        />
      </div>

      {/* Start / End */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.startTime}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, startTime: e.target.value }))
            }
            className="w-full px-4 py-2.5 bg-white text-slate-900 dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.endTime}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, endTime: e.target.value }))
            }
            className="w-full px-4 py-2.5 bg-white text-slate-900 dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            required
          />
        </div>
      </div>

      {/* Invite attendees */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Invite Attendees
        </label>
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleAddAttendee(e.target.value);
              e.target.value = '';
            }
          }}
          className="w-full px-4 py-2.5 bg-white text-slate-900 dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
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

        {selectedUserDetails.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Invited Attendees ({selectedUserDetails.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedUserDetails.map((user) => (
                <span
                  key={user._id}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 text-xs font-medium"
                >
                  {user.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttendee(user._id)}
                    className="p-1 hover:bg-red-600/20 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold shadow-sm"
        >
          {meeting ? 'Update Meeting' : 'Create Meeting'}
        </button>
      </div>
    </form>
  );
};

export default MeetingForm;
