import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, Loader2, AlertCircle } from 'lucide-react';
import { issueService } from '../../services/issue.service';
import { IIssue, IssueStatus, IssuePriority } from '../../types/issue.types';
import { useTeams } from '../../hooks/useTeams';
import { useUsers } from '../../hooks/useUsers';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';

import IssueList from './IssueList';
import IssueForm from './IssueForm';

type StatusTab = 'ALL' | IssueStatus;
type PriorityFilter = 'ALL' | IssuePriority;

interface IssueHomeProps {
  projectId?: string;
}

export const IssueHome: React.FC<IssueHomeProps> = ({ projectId }) => {
  const { user } = useAuth();

  const [issues, setIssues] = useState<IIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusTab, setStatusTab] = useState<StatusTab>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState<IIssue | null>(null);

  const { teams } = useTeams();
  const { users } = useUsers();
  const { socket } = useSocket();

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {};
      if (statusTab !== 'ALL') params.status = statusTab;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (search.trim()) params.search = search.trim();
      if (projectId) params.projectId = projectId;

      const list = await issueService.getIssues(params);
      setIssues(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load issues. Please try again.');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab, priorityFilter, projectId]);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchIssues();
    }, 400);

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (!socket) return;

    const handleCreated = (issue: IIssue) => {
      setIssues((prev) => [issue, ...prev]);
    };

    const handleUpdated = (issue: IIssue) => {
      setIssues((prev) => prev.map((i) => (i._id === issue._id ? issue : i)));
    };

    const handleDeleted = (id: string) => {
      setIssues((prev) => prev.filter((i) => i._id !== id));
    };

    socket.on('issue-created', handleCreated);
    socket.on('issue-assigned', handleUpdated);
    socket.on('issue-status-updated', handleUpdated);
    socket.on('issue-comment-added', handleUpdated);
    socket.on('issue-closed', handleUpdated);
    socket.on('issue-deleted', handleDeleted);

    return () => {
      socket.off('issue-created', handleCreated);
      socket.off('issue-assigned', handleUpdated);
      socket.off('issue-status-updated', handleUpdated);
      socket.off('issue-comment-added', handleUpdated);
      socket.off('issue-closed', handleUpdated);
      socket.off('issue-deleted', handleDeleted);
    };
  }, [socket]);

  const filteredIssues = useMemo(() => {
    let list = [...issues];

    if (statusTab !== 'ALL') {
      list = list.filter((i) => i.status === statusTab);
    }
    if (priorityFilter !== 'ALL') {
      list = list.filter((i) => i.priority === priorityFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.description ?? '').toLowerCase().includes(q) ||
          (typeof i.projectId === 'object' &&
            'name' in i.projectId &&
            (i.projectId as any).name.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [issues, statusTab, priorityFilter, search]);

  const safeTeams =
    teams
      ?.filter((t) => t._id && t.name)
      .map((t) => ({ _id: t._id as string, name: t.name })) ?? [];

  const safeUsers =
    users
      ?.filter((u) => u._id && u.name)
      .map((u) => ({ _id: u._id as string, name: u.name })) ?? [];

  const handleCreateSuccess = () => {
    setShowForm(false);
    setEditingIssue(null);
    fetchIssues();
  };

  const handleEditSuccess = () => {
    setShowForm(false);
    setEditingIssue(null);
    fetchIssues();
  };

  const handleDeleteClick = async (issue: IIssue) => {
    const ok = window.confirm(`Delete issue "${issue.title}"?`);
    if (!ok) return;
    try {
      await issueService.deleteIssue(issue._id);
      fetchIssues();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete issue');
    }
  };

  const isEmployee = user?.role === 'EMPLOYEE';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2 mb-2">
            <AlertCircle
              size={32}
              className="text-blue-600 dark:text-blue-400"
            />
            Issues
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and resolve bugs, incidents, and product issues.
          </p>
          {isEmployee && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use the issue form to raise or update issues for your team.
            </p>
          )}
        </div>

        {/* New Issue – visible for all authenticated users */}
        <button
          type="button"
          onClick={() => {
            setEditingIssue(null);
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3
              bg-gradient-to-r from-blue-600 to-blue-700
              hover:from-blue-700 hover:to-blue-800
              text-white rounded-lg font-semibold transition-all"
        >
          <Plus size={20} />
          New Issue
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="mb-8">
          <IssueForm
            mode={editingIssue ? 'edit' : 'create'}
            issue={editingIssue || undefined}
            projectId={projectId}
            teams={safeTeams}
            users={safeUsers}
            currentUserRole={user?.role}
            onSuccess={editingIssue ? handleEditSuccess : handleCreateSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingIssue(null);
            }}
          />
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search
            size={20}
            className="absolute left-3 top-3 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as StatusTab[]
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusTab(tab)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                statusTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {tab === 'ALL'
                ? 'All'
                : tab === 'IN_PROGRESS'
                ? 'In-progress'
                : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as PriorityFilter[]
          ).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                priorityFilter === p
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Filter size={16} />
              {p === 'ALL' ? 'All' : p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* List / loading / error */}
      {initialLoad && loading ? (
        <div className="text-center py-12 text-gray-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <p>Loading issues...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchIssues}
            className="px-3 py-1 text-xs font-semibold border border-red-200 rounded-md hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      ) : (
        <IssueList
          issues={filteredIssues}
          currentUserId={user?._id}
          currentUserRole={user?.role}
          onEdit={(issue) => {
            setEditingIssue(issue);
            setShowForm(true);
          }}
          onDelete={handleDeleteClick}
        />
      )}
    </div>
  );
};

export default IssueHome;
