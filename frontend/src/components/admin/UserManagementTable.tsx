// src/components/admin/UserManagementTable.tsx
import React, { useEffect, useState } from 'react';
import { Users, Trash2, X, Edit2 } from 'lucide-react';
import { userService } from '../../services/user.service';
import { User, UserRole } from '../../types/user.types';

interface UserManagementTableProps {
  onUserUpdate?: () => void;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
  onUserUpdate,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // side-panel edit state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  useEffect(() => {
    void fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      await userService.updateUser(userId, { role: newRole as UserRole });
      await fetchUsers();
      onUserUpdate?.();
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      setUpdatingUserId(userId);
      await userService.deleteUser(userId);
      await fetchUsers();
      onUserUpdate?.();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Open edit panel with selected user
  const startEdit = (user: User) => {
    setEditingUserId(user._id!);
    setEditForm({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: (user as any).phone || '',
      designation: (user as any).designation || '',
      place: (user as any).place || '',
      role: user.role,
      status: (user as any).status ?? true,
    });
    setIsEditPanelOpen(true);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditForm({});
    setIsEditPanelOpen(false);
  };

  const saveEdit = async () => {
    if (!editingUserId) return;

    try {
      setUpdatingUserId(editingUserId);

      const payload: {
        name?: string;
        role?: UserRole;
        phone?: string;
        designation?: string;
        place?: string;
        status?: boolean;
      } = {};

      if (editForm.name !== undefined) payload.name = editForm.name;
      if (editForm.role !== undefined) payload.role = editForm.role as UserRole;
      if ((editForm as any).phone !== undefined)
        payload.phone = (editForm as any).phone;
      if ((editForm as any).designation !== undefined)
        payload.designation = (editForm as any).designation;
      if ((editForm as any).place !== undefined)
        payload.place = (editForm as any).place;
      if (editForm.status !== undefined) payload.status = editForm.status;

      await userService.updateUser(editingUserId, payload);
      await fetchUsers();
      onUserUpdate?.();
      cancelEdit();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(users.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(
      1,
      safeCurrentPage - Math.floor(maxVisiblePages / 2),
    );
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow relative">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              User Management
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Manage user roles, status, and details
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="itemsPerPage"
              className="text-sm text-slate-600 dark:text-slate-400"
            >
              Show
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    <p className="text-slate-500 dark:text-slate-400">
                      Loading users...
                    </p>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-12 h-12 text-slate-400" />
                    <p className="text-slate-500 dark:text-slate-400">
                      No users found
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => {
                const isRowUpdating = updatingUserId === user._id;
                const effectiveStatus = (user as any).status ?? true;

                return (
                  <tr
                    key={user._id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      isRowUpdating ? 'opacity-50' : ''
                    } ${
                      !effectiveStatus
                        ? 'bg-slate-100 dark:bg-slate-700/30'
                        : ''
                    }`}
                  >
                    {/* User + designation (display only) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {(user as any).designation || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact (display only) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1 text-xs">
                        <div className="text-slate-600 dark:text-slate-400">
                          {user.email}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          {(user as any).phone || '—'}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          {(user as any).place || '—'}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user._id!, e.target.value)
                        }
                        disabled={isRowUpdating || !effectiveStatus}
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                        <option value="INTERN">Intern</option>
                      </select>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          effectiveStatus
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {effectiveStatus ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => startEdit(user)}
                        disabled={isRowUpdating}
                        className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit user"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id!)}
                        disabled={isRowUpdating}
                        className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {users.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-700/50">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(endIndex, users.length)}
              </span>{' '}
              of <span className="font-medium">{users.length}</span> users
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                }
                disabled={safeCurrentPage === 1}
                className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <div className="flex space-x-1">
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      safeCurrentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={safeCurrentPage === totalPages}
                className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit side panel */}
      {isEditPanelOpen && editingUserId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Edit User
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update user details, role and status
                </p>
              </div>
              <button
                onClick={cancelEdit}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name ?? ''}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email ?? ''}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                />
              </div>

              {/* Phone & Place */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={(editForm as any).phone ?? ''}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Place
                  </label>
                  <input
                    type="text"
                    value={(editForm as any).place ?? ''}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        place: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={(editForm as any).designation ?? ''}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      designation: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={(editForm.role as UserRole) ?? 'EMPLOYEE'}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        role: e.target.value as UserRole,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm((prev) => ({
                        ...prev,
                        status: !prev.status,
                      }))
                    }
                    className={`w-full px-3 py-2 text-sm font-medium rounded-lg border ${
                      editForm.status
                        ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-900/30'
                        : 'border-red-500 text-red-700 bg-red-50 dark:bg-red-900/30'
                    }`}
                  >
                    {editForm.status ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={cancelEdit}
                disabled={updatingUserId === editingUserId}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={updatingUserId === editingUserId}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTable;
