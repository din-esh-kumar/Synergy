// src/hooks/useExpenses.ts - EXPENSE MANAGEMENT HOOK
import { useState } from 'react';
import * as expenseService from '../services/expense.service';
import { Expense, ExpenseFormData, ExpenseFilters } from '../types/expense.types';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExpense = async (data: ExpenseFormData) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('category', data.category);
      formData.append('amount', data.amount.toString());
      formData.append('currency', data.currency);
      formData.append('date', data.date);
      formData.append('description', data.description);
      if (data.projectId) formData.append('projectId', data.projectId);
      if (data.merchantName) formData.append('merchantName', data.merchantName);
      if (data.receipt) formData.append('receipt', data.receipt);

      const response = await expenseService.createExpense(formData);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create expense');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchMyExpenses = async (filters?: ExpenseFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseService.getMyExpenses(filters);
      setExpenses(response.data);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch expenses');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (id: string, data: Partial<ExpenseFormData>) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (data.category) formData.append('category', data.category);
      if (data.amount) formData.append('amount', data.amount.toString());
      if (data.currency) formData.append('currency', data.currency);
      if (data.date) formData.append('date', data.date);
      if (data.description) formData.append('description', data.description);
      if (data.projectId) formData.append('projectId', data.projectId);
      if (data.merchantName) formData.append('merchantName', data.merchantName);
      if (data.receipt) formData.append('receipt', data.receipt);

      const response = await expenseService.updateExpense(id, formData);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update expense');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseService.deleteExpense(id);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete expense');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Admin functions
  const fetchAllExpenses = async (filters?: ExpenseFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseService.getAllExpenses(filters);
      setExpenses(response.data);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch expenses');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const approveExpense = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseService.approveExpense(id);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve expense');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectExpense = async (id: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseService.rejectExpense(id, reason);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject expense');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    expenses,
    loading,
    error,
    createExpense,
    fetchMyExpenses,
    updateExpense,
    deleteExpense,
    fetchAllExpenses,
    approveExpense,
    rejectExpense
  };
};
