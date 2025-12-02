// src/components/Issues/IssueForm.tsx
import { useState } from 'react';
import { issueService } from '../../services/issue.service';
import { CreateIssuePayload } from '../../types/issue.types';
import './IssueForm.css';

interface IssueFormProps {
  projectId: string;
  teams?: Array<{ _id: string; name: string }>;
  users?: Array<{ _id: string; name: string }>;
  onSuccess?: () => void;
}

export const IssueForm = ({
  projectId,
  teams,
  users,
  onSuccess,
}: IssueFormProps) => {
  const [formData, setFormData] = useState<CreateIssuePayload>({
    title: '',
    description: '',
    type: 'TASK',
    priority: 'MEDIUM',
    projectId,
    assignee: null,
    team: null,
    dueDate: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await issueService.createIssue(formData);
      setFormData({
        title: '',
        description: '',
        type: 'TASK',
        priority: 'MEDIUM',
        projectId,
        assignee: null,
        team: null,
        dueDate: null,
      });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to create issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="issue-form" onSubmit={handleSubmit}>
      <h3>Create New Issue</h3>

      {error && <div className="issue-form__error">{error}</div>}

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Issue title"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          placeholder="Issue description"
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="TASK">Task</option>
            <option value="BUG">Bug</option>
            <option value="STORY">Story</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="assignee">Assignee</label>
          <select
            id="assignee"
            name="assignee"
            value={formData.assignee || ''}
            onChange={handleChange}
          >
            <option value="">Unassigned</option>
            {users?.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="team">Team</label>
          <select
            id="team"
            name="team"
            value={formData.team || ''}
            onChange={handleChange}
          >
            <option value="">No Team</option>
            {teams?.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="dueDate">Due Date</label>
        <input
          type="date"
          id="dueDate"
          name="dueDate"
          value={formData.dueDate || ''}
          onChange={handleChange}
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Creating...' : 'Create Issue'}
      </button>
    </form>
  );
};
