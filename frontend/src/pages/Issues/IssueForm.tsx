import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { issueService } from '../../services/issue.service';
import {
  CreateIssuePayload,
  UpdateIssuePayload,
  IIssue,
  IssueStatus,
} from '../../types/issue.types';

interface IssueFormProps {
  projectId?: string;
  teams?: Array<{ _id: string; name: string }>;
  users?: Array<{ _id: string; name: string }>;
  mode?: 'create' | 'edit';
  issue?: IIssue | null;
  currentUserRole?: string;
  onSuccess?: () => void;
  onCancel: () => void;
}

type FormState = CreateIssuePayload & { status: IssueStatus };

export const IssueForm: React.FC<IssueFormProps> = ({
  projectId,
  teams,
  users,
  mode = 'create',
  issue,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormState>({
    title: '',
    description: '',
    type: 'TASK',
    priority: 'MEDIUM',
    status: 'OPEN',
    projectId: projectId ?? '',
    assignee: null,
    team: null,
    dueDate: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill in edit mode
  useEffect(() => {
    if (mode === 'edit' && issue) {
      setFormData({
        title: issue.title,
        description: issue.description ?? '',
        type: issue.type,
        priority: issue.priority,
        status: issue.status,
        projectId: issue.projectId?._id ?? projectId ?? '',
        assignee: issue.assignee?._id ?? null,
        team: issue.team?._id ?? null,
        dueDate: issue.dueDate ? issue.dueDate.slice(0, 10) : null,
      });
    }
  }, [mode, issue, projectId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === 'assignee') {
      setFormData((prev) => ({ ...prev, assignee: value || null }));
      return;
    }
    if (name === 'team') {
      setFormData((prev) => ({ ...prev, team: value || null }));
      return;
    }
    if (name === 'dueDate') {
      setFormData((prev) => ({ ...prev, dueDate: value || null }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter an issue title');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (mode === 'create') {
        const payload: CreateIssuePayload = {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          priority: formData.priority,
          projectId: projectId ?? formData.projectId,
          assignee: formData.assignee,
          team: formData.team,
          dueDate: formData.dueDate,
        };
        await issueService.createIssue(payload);
      } else if (mode === 'edit' && issue) {
        const payload: UpdateIssuePayload = {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          priority: formData.priority,
          status: formData.status,
          assignee: formData.assignee,
          team: formData.team,
          dueDate: formData.dueDate,
        };
        await issueService.updateIssue(issue._id, payload);
      }

      if (mode === 'create') {
        setFormData({
          title: '',
          description: '',
          type: 'TASK',
          priority: 'MEDIUM',
          status: 'OPEN',
          projectId: projectId ?? '',
          assignee: null,
          team: null,
          dueDate: null,
        });
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to save issue');
    } finally {
      setLoading(false);
    }
  };

  const headerTitle = mode === 'create' ? 'Create New Issue' : 'Update Issue';

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold">{headerTitle}</h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-xs">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Issue Title *</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="Short, clear summary of the issue"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Report / Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          placeholder="Explain the issue details, impact, and context for the assignee..."
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Type + Priority + Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="TASK">Task</option>
            <option value="BUG">Bug</option>
            <option value="STORY">Story</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In-progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Assignee + Team */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Assignee</label>
          <select
            id="assignee"
            name="assignee"
            value={formData.assignee ?? ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Unassigned</option>
            {users?.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Team</label>
          <select
            id="team"
            name="team"
            value={formData.team ?? ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">No team</option>
            {teams?.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Due date */}
      <div>
        <label className="block text-sm font-medium mb-1">Due Date</label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          value={formData.dueDate ?? ''}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Footer buttons */}
      <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
        >
          {mode === 'create'
            ? loading
              ? 'Creating...'
              : 'Create Issue'
            : loading
            ? 'Saving...'
            : 'Update Issue'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default IssueForm;
