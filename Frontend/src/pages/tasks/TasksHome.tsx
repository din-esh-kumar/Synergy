import React, { useEffect, useState, useCallback } from 'react';
import { CheckSquare, Plus, Search, Filter } from 'lucide-react';
import tasksService from '../../services/tasks.service';
import userService from '../../services/user.service';
import { Task, CreateTaskPayload } from '../../types/task.types';
import { User } from '../../types/user.types';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../components/common/Toast';
import TaskForm from './TaskForm';
import TaskList from './TaskList';

type FilterStatus = 'all' | 'todo' | 'in-progress' | 'completed' | 'blocked';
type FilterPriority = 'all' | 'low' | 'medium' | 'high' | 'urgent';

const TasksHome: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const isEmployee = user?.role === 'EMPLOYEE';

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tasksService.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      showToast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast.error('Failed to load users');
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks, fetchUsers]);

  useEffect(() => {
    let filtered = [...tasks];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (t) => t.status.toUpperCase() === statusFilter.toUpperCase()
      );
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(
        (t) => t.priority.toUpperCase() === priorityFilter.toUpperCase()
      );
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term)
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, statusFilter, priorityFilter, search]);

  const handleCreateTask = async (data: CreateTaskPayload) => {
    if (isEmployee) {
      showToast.error('You are not allowed to create tasks');
      return;
    }

    try {
      const created = await tasksService.createTask(data);
      if (created) {
        showToast.success('Task created successfully! ✅');
        setShowForm(false);
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      showToast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (data: CreateTaskPayload) => {
    if (!editingTask?._id) return;

    // Employee: only update status and report/description
    if (isEmployee) {
      const payload: Partial<CreateTaskPayload> = {
        status: data.status,
        description: data.description,
      } as any;

      try {
        const updated = await tasksService.updateTask(editingTask._id, payload);
        if (updated) {
          showToast.success('Task status and report updated');
          setEditingTask(null);
          setShowForm(false);
          await fetchTasks();
        }
      } catch (error) {
        console.error('Error updating task status:', error);
        showToast.error('Failed to update task status');
      }
      return;
    }

    // Admin / Manager: full update
    try {
      const updated = await tasksService.updateTask(editingTask._id, data);
      if (updated) {
        showToast.success('Task updated successfully! ✏️');
        setEditingTask(null);
        setShowForm(false);
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      showToast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (isEmployee) {
      showToast.error('You are not allowed to delete tasks');
      return;
    }

    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const deleted = await tasksService.deleteTask(id);
      if (deleted) {
        showToast.success('Task deleted successfully! 🗑️');
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast.error('Failed to delete task');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2 mb-2">
            <CheckSquare size={32} className="text-blue-600 dark:text-blue-400" />
            Tasks
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your work tasks.
          </p>
          {user?.role === 'EMPLOYEE' && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use <span className="font-semibold text-blue-600 dark:text-blue-400">Update Status</span> to move the task
              between Todo, In‑progress, Completed, or Blocked, and write a short{" "}
              <span className="font-semibold">Report / Description</span> about what you worked on today.
            </p>
          )}
        </div>
        {user?.role !== 'EMPLOYEE' && (
          <button
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all"
          >
            <Plus size={20} />
            New Task
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-8 bg-white text-slate-900 dark:bg-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <TaskForm
            task={editingTask}
            users={users}
            currentUserRole={user?.role}
            onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            onCancel={() => {
              setShowForm(false);
              setEditingTask(null);
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
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'todo', 'in-progress', 'completed', 'blocked'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'low', 'medium', 'high', 'urgent'] as const).map((priority) => (
            <button
              key={priority}
              onClick={() => setPriorityFilter(priority)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                priorityFilter === priority
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Filter size={16} />
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <p>Loading tasks...</p>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskList
              key={task._id}
              task={task}
              currentUserId={user?._id}
              currentUserRole={user?.role}
              onEdit={() => {
                setEditingTask(task);
                setShowForm(true);
              }}
              onDelete={() => handleDeleteTask(task._id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <CheckSquare size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">No tasks found</p>
        </div>
      )}
    </div>
  );
};

export default TasksHome;























