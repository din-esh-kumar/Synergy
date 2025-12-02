import React from 'react';
import { Trash2, Edit2, Clock, AlertCircle } from 'lucide-react';
import { Task } from '../../types/task.types';

interface TaskListProps {
  task: Task;
  currentUserId?: string;
  onEdit: () => void;
  onDelete: () => void;
}

const TaskList: React.FC<TaskListProps> = ({
  task,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  const assignedUser = typeof task.assignedTo === 'string' 
    ? null 
    : task.assignedTo;

  const createdByUser = typeof task.createdBy === 'string' 
    ? null 
    : task.createdBy;

  const canEdit = currentUserId === createdByUser?._id || currentUserId === assignedUser?._id;

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'URGENT':
        return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
      case 'HIGH':
        return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300';
      case 'LOW':
        return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
      case 'BLOCKED':
        return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{task.title}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>

          {task.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>

            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}

            {assignedUser && (
              <div className="flex items-center gap-1">
                <span>Assigned to: {assignedUser.name}</span>
              </div>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-colors"
              title="Edit task"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors"
              title="Delete task"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {task.comments && task.comments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <AlertCircle size={14} />
            {task.comments.length} comments
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
