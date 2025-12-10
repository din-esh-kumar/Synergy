import { create } from 'zustand';
import apiClient from '../config/api';
import type { Expense, CreateExpenseData, UpdateExpenseData, ApiResponse } from '../types';
import { useAuthStore } from './authStore';

interface ExpenseState {
    expenses: Expense[];
    loading: boolean;
    initialLoading: boolean;
    error: string | null;

    fetchExpenses: (filters?: { startDate?: string; endDate?: string }) => Promise<void>;
    createExpense: (data: CreateExpenseData & { userId?: string; date: string }) => Promise<void>;
    updateExpense: (id: string, data: UpdateExpenseData & { date?: string }) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    submitExpense: (id: string) => Promise<void>;
    approveExpense: (id: string) => Promise<void>;
    rejectExpense: (id: string, reason: string) => Promise<void>;
    clearError: () => void;
    resetInitialLoading: (value?: boolean) => void;
}

const MIN_SKELETON_MS = 500;

export const useExpenseStore = create<ExpenseState>((set, get) => ({
    expenses: [],
    loading: false,
    initialLoading: true,
    error: null,

    fetchExpenses: async (filters?: { startDate?: string; endDate?: string }) => {
        const start = Date.now();
        try {
            set({ expenses: [], loading: true, error: null });
            
            const user = useAuthStore.getState().user;
            if (!user) throw new Error('User not authenticated');

            let response;
            const queryParams = new URLSearchParams();
            
            if (filters?.startDate) queryParams.append('startDate', filters.startDate);
            if (filters?.endDate) queryParams.append('endDate', filters.endDate);
            
            if (user.role === 'admin') {
                queryParams.append('status', 'all');
                response = await apiClient.get(`/api/expenses?${queryParams.toString()}`);
            } else if (user.role === 'manager') {
                queryParams.append('status', 'all');
                response = await apiClient.get(`/api/expenses?${queryParams.toString()}`);
            } else {
                response = await apiClient.get(`/api/expenses?${queryParams.toString()}`);
            }

            const expenses = (response.data.data ?? []) as Expense[];

            const elapsed = Date.now() - start;
            if (elapsed < MIN_SKELETON_MS) {
                await new Promise((res) => setTimeout(res, MIN_SKELETON_MS - elapsed));
            }

            set({ expenses, loading: false, initialLoading: false });
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to fetch expenses';
            set({ error: errorMessage, loading: false, initialLoading: false });
            // // console.error('Fetch expenses error:', error);
        }
    },

    createExpense: async (data: CreateExpenseData & { userId?: string; date: string }) => {
        try {
            set({ loading: true, error: null });
            const user = useAuthStore.getState().user;
            if (!user) throw new Error('User not authenticated');

            const payload = {
                ...data,
                userId: data.userId || user.id
            };

            const formData = new FormData();
            formData.append('amount', String(payload.amount));
            formData.append('description', payload.description);
            formData.append('date', payload.date);
            if (payload.userId) {
                formData.append('userId', payload.userId);
            }
            if (data.receipt && data.receipt instanceof File) {
                formData.append('receipt', data.receipt);
            }

            const response = await apiClient.post<ApiResponse<Expense>>('/api/expenses', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            set((state) => ({ 
                expenses: [response.data.data, ...state.expenses], 
                loading: false 
            }));
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to create expense';
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },

    updateExpense: async (id, data) => {
        try {
            set({ loading: true, error: null });
            const formData = new FormData();
            if (data.date !== undefined) formData.append('date', data.date);
            if (data.amount !== undefined) formData.append('amount', String(data.amount));
            if (data.description !== undefined) formData.append('description', data.description);
            if (data.receipt && data.receipt instanceof File) {
                formData.append('receipt', data.receipt);
            }
            const response = await apiClient.patch<ApiResponse<Expense>>(`/api/expenses/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            set((state) => ({
                expenses: state.expenses.map((e) => (e.id === id ? response.data.data : e)),
                loading: false,
            }));
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to update expense';
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },

    deleteExpense: async (id) => {
        try {
            set({ loading: true, error: null });
            await apiClient.delete(`/api/expenses/${id}`);
            set((state) => ({ 
                expenses: state.expenses.filter((e) => e.id !== id), 
                loading: false 
            }));
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to delete expense';
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },

    submitExpense: async (id) => {
        try {
            set({ loading: true, error: null });
            const response = await apiClient.post<ApiResponse<Expense>>(`/api/expenses/${id}/submit`);
            set((state) => ({
                expenses: state.expenses.map((e) => (e.id === id ? response.data.data : e)),
                loading: false,
            }));
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to submit expense';
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },

    approveExpense: async (id) => {
        try {
            set({ loading: true, error: null });
            const response = await apiClient.post<ApiResponse<Expense>>(`/api/expenses/${id}/approve`);
            set((state) => ({
                expenses: state.expenses.map((e) => (e.id === id ? response.data.data : e)),
                loading: false,
            }));
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to approve expense';
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },

    rejectExpense: async (id, reason) => {
        try {
            set({ loading: true, error: null });
            const response = await apiClient.post<ApiResponse<Expense>>(`/api/expenses/${id}/reject`, { reason });
            set((state) => ({
                expenses: state.expenses.map((e) => (e.id === id ? response.data.data : e)),
                loading: false,
            }));
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to reject expense';
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },

    clearError: () => set({ error: null }),

    resetInitialLoading: (value = false) => set({ initialLoading: value }),
}));