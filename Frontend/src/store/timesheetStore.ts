import { create } from 'zustand';
import apiClient from '../config/api';
import type { Timesheet, CreateTimesheetData, UpdateTimesheetData, ApiResponse } from '../types';
import { useAuthStore } from './authStore';

interface TimesheetState {
  timesheets: Timesheet[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;

  // CRUD Operations
  fetchTimesheets: () => Promise<void>;
  createTimesheet: (data: CreateTimesheetData & { userId?: string }) => Promise<void>;
  updateTimesheet: (id: string, data: UpdateTimesheetData) => Promise<void>;
  deleteTimesheet: (id: string) => Promise<void>;

  // Workflow Operations
  submitTimesheet: (id: string) => Promise<void>;
  approveTimesheet: (id: string) => Promise<void>;
  rejectTimesheet: (id: string, reason: string) => Promise<void>;

  // Utility
  clearError: () => void;
  resetInitialLoading: (value?: boolean) => void;
}

const MIN_SKELETON_MS = 500;

export const useTimesheetStore = create<TimesheetState>((set, get) => ({
  timesheets: [],
  loading: false,
  initialLoading: true,
  error: null,

  // ==================== FETCH TIMESHEETS ====================
  fetchTimesheets: async () => {
    const start = Date.now();
    try {
      set({ timesheets: [], loading: true, error: null });
      
      // Get current user info
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      // Fetch timesheets based on user role
      let response;
      
      if (user.role === 'admin' || user.role === 'manager') {
        // Admin and manager can see all relevant timesheets
        response = await apiClient.get<ApiResponse<Timesheet[]>>('/api/timesheets?status=all');
      } else {
        // Employee can only see their own timesheets
        response = await apiClient.get<ApiResponse<Timesheet[]>>('/api/timesheets');
      }

      const timesheets = response.data.data ?? [];

      const elapsed = Date.now() - start;
      if (elapsed < MIN_SKELETON_MS) {
        await new Promise((res) => setTimeout(res, MIN_SKELETON_MS - elapsed));
      }

      set({ timesheets, loading: false, initialLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch timesheets';
      set({ error: errorMessage, loading: false, initialLoading: false });
      // console.error('Fetch timesheets error:', error);
    }
  },

  // ==================== CREATE TIMESHEET ====================
  createTimesheet: async (data: CreateTimesheetData & { userId?: string }) => {
    try {
      set({ loading: true, error: null });
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      // For admins and managers, they can specify userId in the data
      // For employees, the userId will be set to their own ID
      const payload = {
        ...data,
        userId: data.userId || user.id,
        date: typeof data.date === 'string' ? data.date : data.date.toISOString(),
      };

      const response = await apiClient.post<ApiResponse<Timesheet>>('/api/timesheets', payload);
      const newTimesheet = response.data.data;

      set(state => ({
        timesheets: [newTimesheet, ...state.timesheets],
        loading: false,
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create timesheet';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // ==================== UPDATE TIMESHEET ====================
  updateTimesheet: async (id: string, data: UpdateTimesheetData) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.patch<ApiResponse<Timesheet>>(
        `/api/timesheets/${id}`,
        data
      );
      const updatedTimesheet = response.data.data;

      set((state) => ({
        timesheets: state.timesheets.map((t) =>
          t.id === id ? updatedTimesheet : t
        ),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update timesheet';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // ==================== DELETE TIMESHEET ====================
  deleteTimesheet: async (id: string) => {
    try {
      set({ loading: true, error: null });
      await apiClient.delete(`/api/timesheets/${id}`);

      set((state) => ({
        timesheets: state.timesheets.filter((t) => t.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete timesheet';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // ==================== SUBMIT TIMESHEET ====================
  submitTimesheet: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.post<ApiResponse<Timesheet>>(
        `/api/timesheets/${id}/submit`
      );
      const submittedTimesheet = response.data.data;

      set((state) => ({
        timesheets: state.timesheets.map((t) =>
          t.id === id ? submittedTimesheet : t
        ),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit timesheet';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // ==================== APPROVE TIMESHEET (Manager/Admin) ====================
  approveTimesheet: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.post<ApiResponse<Timesheet>>(
        `/api/timesheets/${id}/approve`
      );
      const approvedTimesheet = response.data.data;

      set((state) => ({
        timesheets: state.timesheets.map((t) =>
          t.id === id ? approvedTimesheet : t
        ),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to approve timesheet';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // ==================== REJECT TIMESHEET (Manager/Admin) ====================
  rejectTimesheet: async (id: string, reason: string) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.post<ApiResponse<Timesheet>>(
        `/api/timesheets/${id}/reject`,
        { reason }
      );
      const rejectedTimesheet = response.data.data;

      set((state) => ({
        timesheets: state.timesheets.map((t) =>
          t.id === id ? rejectedTimesheet : t
        ),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reject timesheet';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // ==================== CLEAR ERROR ====================
  clearError: () => set({ error: null }),

  // ==================== RESET/TOGGLE INITIAL LOADING ====================
  resetInitialLoading: (value = false) => set({ initialLoading: value }),
}));