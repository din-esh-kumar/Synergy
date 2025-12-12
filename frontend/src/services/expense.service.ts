// src/services/expense.service.ts - EXPENSE DATA ACCESS
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Employee Expense Services
export const createExpense = async (expenseData: FormData) => {
  const response = await axios.post(`${API_URL}/expenses`, expenseData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getMyExpenses = async (filters?: any) => {
  const response = await axios.get(`${API_URL}/expenses/my-expenses`, { params: filters });
  return response.data;
};

export const getExpenseById = async (id: string) => {
  const response = await axios.get(`${API_URL}/expenses/${id}`);
  return response.data;
};

export const updateExpense = async (id: string, expenseData: FormData) => {
  const response = await axios.put(`${API_URL}/expenses/${id}`, expenseData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteExpense = async (id: string) => {
  const response = await axios.delete(`${API_URL}/expenses/${id}`);
  return response.data;
};

// Admin/Manager Expense Services
export const getAllExpenses = async (filters?: any) => {
  const response = await axios.get(`${API_URL}/expenses/admin/all`, { params: filters });
  return response.data;
};

export const approveExpense = async (id: string) => {
  const response = await axios.put(`${API_URL}/expenses/admin/${id}/approve`);
  return response.data;
};

export const rejectExpense = async (id: string, rejectionReason: string) => {
  const response = await axios.put(`${API_URL}/expenses/admin/${id}/reject`, { rejectionReason });
  return response.data;
};

export const getExpenseStats = async (startDate?: string, endDate?: string) => {
  const response = await axios.get(`${API_URL}/expenses/admin/stats`, {
    params: { startDate, endDate }
  });
  return response.data;
};
