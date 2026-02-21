import React, { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Search, Filter } from 'lucide-react';
import adminService from '../../services/admin.service';
import {
  AdminUser,
  CreateUserPayload,
  UpdateUserPayload,
} from '../../types/admin.types';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../components/common/Toast';
import UserForm from './UserForm';
import UserList from './UserList';

type FilterRole = 'all' | 'admin' | 'manager' | 'employee';

const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [user?.role, fetchUsers]);

  useEffect(() => {
    let filtered = [...users];

    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) =>
        u.role.toLowerCase() === roleFilter
      );
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
      );
    }

    setFilteredUsers(filtered);
  }, [users, roleFilter, search]);

  const handleCreateUser = async (data: CreateUserPayload) => {
    try {
      const created = await adminService.createUser(data);
      if (created) {
        showToast.success('User created successfully! ✅');
        setShowForm(false);
        await fetchUsers();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      showToast.error(
        error.response?.data?.message || 'Failed to create user'
      );
    }
  };

  const handleUpdateUser = async (data: UpdateUserPayload) => {
    if (!editingUser?._id) return;
    try {
      const updated = await adminService.updateUser(editingUser._id, data);
      if (updated) {
        showToast.success('User updated successfully! ✏️');
        setEditingUser(null);
        setShowForm(false);
        await fetchUsers();
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      showToast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this user? This action cannot be undone.'
      )
    )
      return;
    try {
      const deleted = await adminService.deleteUser(id);
      if (deleted) {
        showToast.success('User deleted successfully! 🗑️');
        await fetchUsers();
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showToast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleAssignRole = async (
    id: string,
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  ) => {
    try {
      await adminService.assignRole(id, role);
      showToast.success(`Role updated to ${role}! 🔄`);
      await fetchUsers();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      showToast.error(
        error.response?.data?.message || 'Failed to assign role'
      );
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Only administrators can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2 mb-2">
            <Users size={32} className="text-green-600 dark:text-green-400" />
            User
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage system users and assign roles
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all"
        >
          <Plus size={20} />
          New User
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-white text-slate-900 dark:bg-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <UserForm
            user={editingUser}
            onSubmit={
              editingUser
                ? (data) =>
                    handleUpdateUser({
                      name: data.name,
                      phone: data.phone,
                      designation: data.designation,
                      role: data.role,
                    })
                : handleCreateUser
            }
            onCancel={() => {
              setShowForm(false);
              setEditingUser(null);
            }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'admin', 'manager', 'employee'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                roleFilter === role
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Filter size={16} />
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <p>Loading users...</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredUsers.map((u) => (
                  <UserList
                    key={u._id}
                    user={u}
                    onEdit={() => {
                      setEditingUser(u);
                      setShowForm(true);
                    }}
                    onDelete={() => handleDeleteUser(u._id)}
                    onAssignRole={(role) => handleAssignRole(u._id, role)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No users found
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
