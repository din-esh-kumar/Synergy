import React, { useEffect, useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { issueService } from '../../services/issue.service';
import { showToast } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';
import '../Issues/IssueList.css';

export interface Issue {
  _id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | string;
  type: 'BUG' | 'TASK' | 'IMPROVEMENT' | string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  assignee?: {
    _id: string;
    name: string;
    email: string;
  };
  project?: {
    _id: string;
    name: string;
  };
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = 'all' | 'open' | 'in-progress' | 'resolved' | 'closed';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

const IssueList: React.FC = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchIssues = async () => {
  setLoading(true);
  try {
    const data = await issueService.getIssues();

    // Normalize to an array
    const list =
      Array.isArray(data)
        ? data
        : Array.isArray(data?.issues)
        ? data.issues
        : [];

    setIssues(list as Issue[]);
  } catch (error) {
    console.error('Error fetching issues:', error);
    showToast.error('Failed to load issues');
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchIssues();
    const interval = setInterval(fetchIssues, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = [...issues];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((issue) => {
        const normalized = issue.status.toLowerCase().replace('_', '-');
        return normalized === statusFilter;
      });
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((issue) => {
        const normalized = (issue.priority || '').toLowerCase();
        return normalized === priorityFilter;
      });
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (issue) =>
          issue.title.toLowerCase().includes(term) ||
          issue.description?.toLowerCase().includes(term) ||
          issue.project?.name.toLowerCase().includes(term)
      );
    }

    setFilteredIssues(filtered);
  }, [issues, statusFilter, priorityFilter, search]);

  const getStatusClasses = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'OPEN') return 'bg-blue-100 text-blue-700';
    if (s === 'IN_PROGRESS') return 'bg-yellow-100 text-yellow-800';
    if (s === 'RESOLVED') return 'bg-green-100 text-green-700';
    if (s === 'CLOSED') return 'bg-slate-200 text-slate-700';
    return 'bg-slate-100 text-slate-700';
  };

  const getPriorityClasses = (priority?: string) => {
    const p = (priority || '').toUpperCase();
    if (p === 'LOW') return 'text-emerald-500';
    if (p === 'MEDIUM') return 'text-blue-500';
    if (p === 'HIGH') return 'text-orange-500';
    if (p === 'CRITICAL') return 'text-red-500';
    return 'text-slate-400';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Issues</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Track and resolve bugs, incidents, and product issues.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search issues..."
              className="w-56 pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {user?.role !== 'EMPLOYEE' && (
            <button className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">
              <Plus size={16} />
              New Issue
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['all', 'open', 'in-progress', 'resolved', 'closed'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Priority:
          </span>
          {(['all', 'low', 'medium', 'high', 'critical'] as const).map(
            (priority) => (
              <button
                key={priority}
                onClick={() => setPriorityFilter(priority)}
                className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  priorityFilter === priority
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <div className="issue-table-wrapper bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading issues...
            </p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-900/40 text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 text-left">Issue</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Priority</th>
                <th className="px-6 py-3 text-left">Assignee</th>
                <th className="px-6 py-3 text-left">Due date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredIssues.map((issue) => (
                <tr
                  key={issue._id}
                  className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-sm">{issue.title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {issue.description}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClasses(
                        issue.status
                      )}`}
                    >
                      {issue.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs uppercase text-slate-500">
                    {issue.type}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-semibold ${getPriorityClasses(
                        issue.priority
                      )}`}
                    >
                      {issue.priority || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {issue.assignee?.name ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {issue.dueDate
                      ? new Date(issue.dueDate).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button className="text-blue-600 hover:text-blue-700 mr-3">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredIssues.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No issues found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export { IssueList };
export default IssueList;
