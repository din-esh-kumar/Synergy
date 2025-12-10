import { create } from 'zustand';
import apiClient from '../config/api';
import type { Timesheet, Expense, Leave, User, Project } from '../types';

interface ApprovalStoreState {
  pendingTimesheets: Timesheet[];
  pendingExpenses: Expense[];
  pendingLeaves: Leave[];
  users: User[];
  projects: Project[];
  loading: boolean;
  error: string | null;

  fetchAllPending: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchProjects: () => Promise<void>;

  approveTimesheet: (id: string) => Promise<void>;
  rejectTimesheet: (id: string, reason: string) => Promise<void>;
  approveExpense: (id: string) => Promise<void>;
  rejectExpense: (id: string, reason: string) => Promise<void>;
  approveLeave: (id: string) => Promise<void>;
  rejectLeave: (id: string, reason: string) => Promise<void>;

  removeTimesheet: (id: string) => void;
  removeExpense: (id: string) => void;
  removeLeave: (id: string) => void;

  clearError: () => void;
}

export const useApprovalStore = create<ApprovalStoreState>((set) => ({
  pendingTimesheets: [],
  pendingExpenses: [],
  pendingLeaves: [],
  users: [],
  projects: [],
  loading: false,
  error: null,

  // Fetch all pending data
  fetchAllPending: async () => {
    try {
      set({ loading: true, error: null });
      const [t, e, l] = await Promise.all([
        apiClient.get('/api/timesheets?status=submitted'),
        apiClient.get('/api/expenses?status=submitted'),
        apiClient.get('/api/leaves?status=submitted'),
      ]);
      set({
        pendingTimesheets: t.data.data || [],
        pendingExpenses: e.data.data || [],
        pendingLeaves: l.data.data || [],
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to fetch pending items',
        loading: false,
      });
    }
  },

  // Fetch users
  fetchUsers: async () => {
    try {
      const response = await apiClient.get('/api/user');
      set({ users: response.data.data || [] });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to fetch users',
      });
    }
  },

  // Fetch projects
  fetchProjects: async () => {
    try {
      const response = await apiClient.get('/api/projects');
      set({ projects: response.data.data || [] });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to fetch projects',
      });
    }
  },

  // ✅ Approve/Reject with local removal
  approveTimesheet: async (id: string) => {
    await apiClient.post(`/api/timesheets/${id}/approve`);
    set((state) => ({
      pendingTimesheets: state.pendingTimesheets.filter((t) => t.id !== id && (t as any)._id !== id),
    }));
  },

  rejectTimesheet: async (id: string, reason: string) => {
    await apiClient.post(`/api/timesheets/${id}/reject`, { reason });
    set((state) => ({
      pendingTimesheets: state.pendingTimesheets.filter((t) => t.id !== id && (t as any)._id !== id),
    }));
  },

  approveExpense: async (id: string) => {
    await apiClient.post(`/api/expenses/${id}/approve`);
    set((state) => ({
      pendingExpenses: state.pendingExpenses.filter((e) => e.id !== id && (e as any)._id !== id),
    }));
  },

  rejectExpense: async (id: string, reason: string) => {
    await apiClient.post(`/api/expenses/${id}/reject`, { reason });
    set((state) => ({
      pendingExpenses: state.pendingExpenses.filter((e) => e.id !== id && (e as any)._id !== id),
    }));
  },

  approveLeave: async (id: string) => {
    await apiClient.post(`/api/leaves/${id}/approve`);
    set((state) => ({
      pendingLeaves: state.pendingLeaves.filter((l) => l.id !== id && (l as any)._id !== id),
    }));
  },

  rejectLeave: async (id: string, reason: string) => {
    await apiClient.post(`/api/leaves/${id}/reject`, { reason });
    set((state) => ({
      pendingLeaves: state.pendingLeaves.filter((l) => l.id !== id && (l as any)._id !== id),
    }));
  },

  // ✅ Manual removal (optional for local UI)
  removeTimesheet: (id: string) =>
    set((state) => ({
      pendingTimesheets: state.pendingTimesheets.filter((t) => t.id !== id && (t as any)._id !== id),
    })),

  removeExpense: (id: string) =>
    set((state) => ({
      pendingExpenses: state.pendingExpenses.filter((e) => e.id !== id && (e as any)._id !== id),
    })),

  removeLeave: (id: string) =>
    set((state) => ({
      pendingLeaves: state.pendingLeaves.filter((l) => l.id !== id && (l as any)._id !== id),
    })),

  clearError: () => set({ error: null }),
}));
