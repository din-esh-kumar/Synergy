import { create } from 'zustand';
import apiClient from '../config/api';
import type { Leave, CreateLeaveData, UpdateLeaveData, LeaveType, LeaveBalance } from '../types';
import { useAuthStore } from './authStore';

interface LeaveState {
  // Core data
  leaves: Leave[];
  leaveTypes: LeaveType[];
  leaveBalances: LeaveBalance[];

  // Loading states
  loading: boolean;
  initialLoading: boolean;
  loadingBalances: boolean;
  loadingTypes: boolean;

  // Error handling
  error: string | null;

  // Core actions
  fetchLeaves: (filters?: { status?: string; userId?: string }) => Promise<void>;
  fetchLeaveTypes: () => Promise<void>;
  fetchLeaveBalances: (userId?: string) => Promise<void>;
  createLeave: (data: CreateLeaveData & { userId?: string }) => Promise<void>;
  updateLeave: (id: string, data: UpdateLeaveData) => Promise<void>;
  deleteLeave: (id: string) => Promise<void>;
  submitLeave: (id: string) => Promise<void>;
  approveLeave: (id: string) => Promise<void>;
  rejectLeave: (id: string, reason: string) => Promise<void>;

  // Utility actions
  clearError: () => void;
  resetInitialLoading: (value?: boolean) => void;

  // Selectors (computed values)
  getPendingLeaves: () => Leave[];
  getApprovedLeaves: () => Leave[];
  getRejectedLeaves: () => Leave[];
  getDraftLeaves: () => Leave[];
  getTeamPendingLeaves: (managerId: string) => Leave[];
  getAvailableLeaveTypes: () => LeaveType[];
  getLeaveBalanceByType: (leaveTypeId: string) => LeaveBalance | undefined;
  getLeavesByStatus: (status: Leave['status']) => Leave[];
}

const MIN_SKELETON_MS = 500;

export const useLeaveStore = create<LeaveState>((set, get) => ({
  // Initial state
  leaves: [],
  leaveTypes: [],
  leaveBalances: [],
  loading: false,
  initialLoading: true,
  loadingBalances: false,
  loadingTypes: false,
  error: null,

  // Fetch leaves with optional filtering
  // In leaveStore.ts - Update fetchLeaves method
  fetchLeaves: async (filters = {}) => {
    const start = Date.now();
    try {
      set({ loading: true, error: null });

      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      if (filters.userId) {
        queryParams.append('userId', filters.userId);
      }

      const queryString = queryParams.toString();

      // Use the correct endpoint - FIXED
      let url = '/api/leaves';
      if (queryString) {
        url += `?${queryString}`;
      }

      // // console.log('🔄 Fetching leaves from:', url);

      const response = await apiClient.get(url);
      // // console.log('✅ Leaves API response:', response.data);

      const leavesData = (response.data.data ?? []) as Leave[];
      // // console.log('📊 Processed leaves data:', leavesData.length, 'leaves');

      // Ensure minimum loading time for better UX
      const elapsed = Date.now() - start;
      if (elapsed < MIN_SKELETON_MS) {
        await new Promise((res) => setTimeout(res, MIN_SKELETON_MS - elapsed));
      }

      set({ leaves: leavesData, loading: false, initialLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch leaves';
      // // console.error('❌ Fetch leaves error:', error);
      set({ error: errorMessage, loading: false, initialLoading: false });
      throw error;
    }
  },

  // Fetch leave types
  fetchLeaveTypes: async () => {
    try {
      set({ loadingTypes: true, error: null });
      const response = await apiClient.get('/api/leaves/types');
      const leaveTypes = response.data.data || [];
      set({ leaveTypes, loadingTypes: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch leave types';
      set({ error: errorMessage, loadingTypes: false });
      // // console.error('Fetch leave types error:', error);
      throw error;
    }
  },

  // Fetch leave balances
  fetchLeaveBalances: async (userId?: string) => {
    try {
      set({ loadingBalances: true, error: null });

      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const targetUserId = userId || user.id;
      const response = await apiClient.get(`/api/leaves/balances?userId=${targetUserId}`);
      const leaveBalances = response.data.data || [];

      set({ leaveBalances, loadingBalances: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch leave balances';
      set({ error: errorMessage, loadingBalances: false });
      // // console.error('Fetch leave balances error:', error);
      throw error;
    }
  },

  createLeave: async (data: CreateLeaveData & { userId?: string }) => {
    try {
      set({ loading: true, error: null });
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const payload = {
        userId: data.userId || user.id,
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason || ''
      };

      const response = await apiClient.post('/api/leaves', payload);
      const newLeave = response.data.data;

      set((state) => ({
        leaves: [newLeave, ...state.leaves],
        loading: false
      }));

      // Refresh balances after creating leave
      get().fetchLeaveBalances(data.userId || user.id);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create leave';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateLeave: async (id, data) => {
    try {
      set({ loading: true, error: null });

      const payload: any = {};
      if (data.leaveTypeId) payload.leaveTypeId = data.leaveTypeId;
      if (data.startDate) payload.startDate = data.startDate;
      if (data.endDate) payload.endDate = data.endDate;
      if (data.reason !== undefined) payload.reason = data.reason;

      const response = await apiClient.patch(`/api/leaves/${id}`, payload);
      const updatedLeave = response.data.data;

      set((state) => ({
        leaves: state.leaves.map((l) => (l.id === id ? updatedLeave : l)),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update leave';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  deleteLeave: async (id) => {
    try {
      set({ loading: true, error: null });
      await apiClient.delete(`/api/leaves/${id}`);

      const deletedLeave = get().leaves.find(l => l.id === id);

      set((state) => ({
        leaves: state.leaves.filter((l) => l.id !== id),
        loading: false
      }));

      // Refresh balances after deleting leave
      if (deletedLeave) {
        get().fetchLeaveBalances(deletedLeave.userId);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete leave';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  submitLeave: async (id) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.post(`/api/leaves/${id}/submit`);
      const submittedLeave = response.data.data;

      set((state) => ({
        leaves: state.leaves.map((l) => (l.id === id ? submittedLeave : l)),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit leave';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  approveLeave: async (id) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.post(`/api/leaves/${id}/approve`);
      const approvedLeave = response.data.data;

      set((state) => ({
        leaves: state.leaves.map((l) => (l.id === id ? approvedLeave : l)),
        loading: false,
      }));

      // Refresh balances after approval
      get().fetchLeaveBalances(approvedLeave.userId);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to approve leave';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  rejectLeave: async (id, reason) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.post(`/api/leaves/${id}/reject`, { reason });
      const rejectedLeave = response.data.data;

      set((state) => ({
        leaves: state.leaves.map((l) => (l.id === id ? rejectedLeave : l)),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reject leave';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  resetInitialLoading: (value = false) => set({ initialLoading: value }),

  // Computed selectors - NOW WORKING WITH UPDATED INTERFACE
  getPendingLeaves: () => {
    const state = get();
    return state.leaves.filter(leave => leave.status === 'submitted');
  },

  getApprovedLeaves: () => {
    const state = get();
    return state.leaves.filter(leave => leave.status === 'approved');
  },

  getRejectedLeaves: () => {
    const state = get();
    return state.leaves.filter(leave => leave.status === 'rejected');
  },

  getDraftLeaves: () => {
    const state = get();
    return state.leaves.filter(leave => leave.status === 'draft');
  },

  getTeamPendingLeaves: (managerId: string) => {
    const state = get();
    return state.leaves.filter(leave =>
      leave.status === 'submitted' &&
      leave.user?.managerId === managerId
    );
  },

  getAvailableLeaveTypes: () => {
    const state = get();
    return state.leaveTypes.filter(type => type.isActive);
  },

  getLeaveBalanceByType: (leaveTypeId: string) => {
    const state = get();
    return state.leaveBalances.find(balance => balance.leaveTypeId === leaveTypeId);
  },

  getLeavesByStatus: (status: Leave['status']) => {
    const state = get();
    return state.leaves.filter(leave => leave.status === status);
  }
}));