import React, { useState } from 'react';
import { Trash2, Edit2, Shield } from 'lucide-react';
import { AdminUser } from '../../types/admin.types';

interface UserListProps {
  user: AdminUser;
  onEdit: () => void;
  onDelete: () => void;
  onAssignRole: (role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE') => void;
}

const UserList: React.FC<UserListProps> = ({
  user,
  onEdit,
  onDelete,
  onAssignRole,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
      case 'MANAGER':
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
      case 'EMPLOYEE':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusBadge = (status: boolean) => {
    return status
      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
      : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
  };

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.designation || 'No designation'}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm">{user.email}</p>
        {user.phone && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.phone}</p>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`px-3 py-1 text-sm rounded-full font-medium inline-flex items-center gap-2 ${getRoleBadge(
              user.role
            )} hover:opacity-80 transition-opacity`}
          >
            <Shield size={14} />
            {user.role}
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
              {['EMPLOYEE', 'MANAGER', 'ADMIN'].map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    onAssignRole(role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm ${
                    user.role === role ? 'font-bold text-blue-600 dark:text-blue-400' : ''
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`px-3 py-1 text-sm rounded-full font-medium inline-block ${getStatusBadge(
            user.status
          )}`}
        >
          {user.status ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-colors"
            title="Edit user"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors"
            title="Delete user"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default UserList;
