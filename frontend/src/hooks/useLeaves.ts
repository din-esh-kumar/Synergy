// src/hooks/useLeaves.ts - LEAVE MANAGEMENT HOOK
import { useState } from 'react';
import * as leaveService from '../services/leave.service';
import { Leave, LeaveFormData, LeaveBalance, LeaveFilters } from '../types/leave.types';

export const useLeaves = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyLeave = async (data: LeaveFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await leaveService.applyLeave(data);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to apply for leave');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchMyLeaves = async (filters?: LeaveFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await leaveService.getMyLeaves(filters);
      setLeaves(response.data);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch leaves');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async (year?: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await leaveService.getLeaveBalance(year);
      setBalances(response.data);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch balance');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateLeave = async (id: string, data: Partial<LeaveFormData>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await leaveService.updateLeave(id, data);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update leave');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelLeave = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await leaveService.cancelLeave(id);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel leave');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Admin functions
  const fetchAllLeaves = async (filters?: LeaveFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await leaveService.getAllLeaves(filters);
      setLeaves(response.data);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch leaves');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const approveLeave = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await leaveService.updateLeaveStatus(id, 'APPROVED');
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve leave');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectLeave = async (id: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await leaveService.updateLeaveStatus(id, 'REJECTED', reason);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject leave');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    leaves,
    balances,
    loading,
    error,
    applyLeave,
    fetchMyLeaves,
    fetchLeaveBalance,
    updateLeave,
    cancelLeave,
    fetchAllLeaves,
    approveLeave,
    rejectLeave
  };
};
