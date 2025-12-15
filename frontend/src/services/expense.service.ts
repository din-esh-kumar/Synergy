// src/services/expense.service.ts - EXPENSE DATA ACCESS

import api from './api';

// Employee Expense Services

export const createExpense = async (expenseData: FormData) => {
  const response = await api.post('/expenses', expenseData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getMyExpenses = async (filters?: any) => {
  const response = await api.get('/expenses/my-expenses', {
    params: filters,
  });
  return response.data;
};

export const getExpenseById = async (id: string) => {
  const response = await api.get(`/expenses/${id}`);
  return response.data;
};

export const updateExpense = async (id: string, expenseData: FormData) => {
  const response = await api.put(`/expenses/${id}`, expenseData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteExpense = async (id: string) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
};

// Admin/Manager Expense Services

export const getAllExpenses = async (filters?: any) => {
  const response = await api.get('/expenses/admin/all', {
    params: filters,
  });
  return response.data;
};

export const approveExpense = async (id: string) => {
  const response = await api.put(`/expenses/admin/${id}/approve`);
  return response.data;
};

export const rejectExpense = async (id: string, rejectionReason: string) => {
  const response = await api.put(`/expenses/admin/${id}/reject`, {
    rejectionReason,
  });
  return response.data;
};

export const getExpenseStats = async (startDate?: string, endDate?: string) => {
  const response = await api.get('/expenses/admin/stats', {
    params: { startDate, endDate },
  });
  return response.data;
};
