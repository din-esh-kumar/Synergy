import React from 'react';
import { Trash2, Edit2, Users, Calendar, DollarSign } from 'lucide-react';
import { Project } from '../../types/project.types';

interface ProjectListProps {
  project: Project;
  currentUserId?: string;
  onEdit: () => void;
  onDelete: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  project,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  const owner = typeof project.owner === 'string' ? null : project.owner;
  const canEdit = currentUserId === owner?._id;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
      case 'ACTIVE':
        return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
      case 'ON_HOLD':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300';
      case 'COMPLETED':
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
      case 'CANCELLED':
        return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300';
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    return visibility === 'PUBLIC'
      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
  };

  const teamMembers = Array.isArray(project.team)
    ? project.team.filter((member) => typeof member === 'object')
    : [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
          <span
            className={`inline-block px-3 py-1 text-xs rounded-full ${getStatusColor(
              project.status
            )}`}
          >
            {project.status.replace('_', ' ')}
          </span>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-colors"
              title="Edit project"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors"
              title="Delete project"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Details Grid */}
      <div className="space-y-3 mb-4">
        {project.startDate && project.endDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar size={16} />
            <span>
              {new Date(project.startDate).toLocaleDateString()} -{' '}
              {new Date(project.endDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {teamMembers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users size={16} />
            <span>{teamMembers.length} team members</span>
          </div>
        )}

        {project.budget && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <DollarSign size={16} />
            <span>${project.budget.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
        <span
          className={`inline-block px-3 py-1 text-xs rounded-full ${getVisibilityBadge(
            project.visibility
          )}`}
        >
          {project.visibility}
        </span>

        {owner && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            by {owner.name}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProjectList;

