import React from 'react';
import { IIssue } from '../../types/issue.types';

interface IssueListProps {
  issues: IIssue[];
  currentUserId?: string;
  currentUserRole?: string;
  onEdit?: (issue: IIssue) => void;
  onDelete?: (issue: IIssue) => void;
}

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  onEdit,
  onDelete,
}) => {
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
    <table className="min-w-full text-sm">
      <thead className="bg-slate-100 text-xs uppercase text-slate-500">
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
      <tbody className="divide-y divide-slate-200">
        {issues.map((issue) => (
          <tr
            key={issue._id}
            className="bg-white hover:bg-slate-50 transition-colors"
          >
            <td className="px-6 py-5">
              <p className="font-medium text-sm">{issue.title}</p>
              {issue.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                  {issue.description}
                </p>
              )}
            </td>

            <td className="px-6 py-5">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClasses(
                  issue.status,
                )}`}
              >
                {issue.status.replace('_', ' ')}
              </span>
            </td>

            <td className="px-6 py-5 text-xs uppercase text-slate-500">
              {issue.type}
            </td>

            <td className="px-6 py-5">
              <span
                className={`text-xs font-semibold ${getPriorityClasses(
                  issue.priority,
                )}`}
              >
                {issue.priority || '-'}
              </span>
            </td>

            <td className="px-6 py-5 text-sm">
              {issue.assignee?.name ?? '-'}
            </td>

            <td className="px-6 py-5 text-sm">
              {issue.dueDate
                ? new Date(issue.dueDate).toLocaleDateString()
                : '-'}
            </td>

            <td className="px-6 py-5 text-right text-sm">
              {onEdit && (
                <button
                  className="text-blue-600 hover:text-blue-700 mr-3"
                  onClick={() => onEdit(issue)}
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  className="text-red-600 hover:text-red-700"
                  onClick={() => onDelete(issue)}
                >
                  Delete
                </button>
              )}
            </td>
          </tr>
        ))}

        {issues.length === 0 && (
          <tr>
            <td
              colSpan={7}
              className="px-6 py-10 text-center text-sm text-slate-500"
            >
              No issues found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default IssueList;
