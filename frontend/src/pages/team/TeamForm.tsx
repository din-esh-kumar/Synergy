// src/pages/team/TeamForm.tsx
import React, { useState } from 'react';
import { User } from '../../types/user.types';

interface TeamFormProps {
  initialData?: {
    name: string;
    description?: string;
    lead?: string;        // user id
    members?: string[];   // user ids
  };
  users: User[];
  onSubmit: (payload: {
    name: string;
    description?: string;
    lead: string;
    members: string[];
  }) => Promise<void> | void;
  onCancel: () => void;
}

const TeamForm: React.FC<TeamFormProps> = ({
  initialData,
  users,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [lead, setLead] = useState(initialData?.lead ?? '');
  const [members, setMembers] = useState<string[]>(initialData?.members ?? []);
  const [submitting, setSubmitting] = useState(false);

  const handleMembersChange = (userId: string) => {
    setMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !lead) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        lead,
        members,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = Boolean(initialData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? 'Edit Team' : 'New Team'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Team name
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Platform Engineering"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Description
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description of the team's responsibilities"
            />
          </div>

          {/* Team lead */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Team lead
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={lead}
              onChange={e => setLead(e.target.value)}
              required
            >
              <option value="">Select lead</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Team members */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Team members
            </label>
            <div className="max-h-40 overflow-y-auto border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 space-y-1">
              {users.map(u => (
                <label
                  key={u._id}
                  className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
                >
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 dark:border-slate-600"
                    checked={members.includes(u._id)}
                    onChange={() => handleMembersChange(u._id)}
                  />
                  <span>
                    {u.name}{' '}
                    <span className="text-xs text-slate-400">({u.email})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamForm;