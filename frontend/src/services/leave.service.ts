// src/services/leave.service.ts - DATA ACCESS LAYER

import api from './api';
import { LeaveFormData, LeaveFilters } from '../types/leave.types';

// ================= EMPLOYEE LEAVE SERVICES =================

export const applyLeave = async (leaveData: LeaveFormData) => {
  const response = await api.post('/leaves/apply', leaveData);
  return response.data;
};

export const getMyLeaves = async (filters?: LeaveFilters) => {
  const response = await api.get('/leaves/my-leaves', { params: filters });
  return response.data;
};

export const getLeaveById = async (id: string) => {
  const response = await api.get(`/leaves/${id}`);
  return response.data;
};

export const updateLeave = async (
  id: string,
  leaveData: Partial<LeaveFormData>,
) => {
  const response = await api.put(`/leaves/${id}`, leaveData);
  return response.data;
};

export const cancelLeave = async (id: string) => {
  const response = await api.delete(`/leaves/${id}/cancel`);
  return response.data;
};

export const getLeaveBalance = async (year?: number) => {
  const response = await api.get('/leaves/balance', { params: { year } });
  return response.data;
};

export const getLeaveHistory = async (page = 1, limit = 10) => {
  const response = await api.get('/leaves/history', {
    params: { page, limit },
  });
  return response.data;
};

// ================= ADMIN / MANAGER LEAVE SERVICES =================

export const getAllLeaves = async (filters?: LeaveFilters) => {
  const response = await api.get('/leaves/admin/all', { params: filters });
  return response.data;
};

export const updateLeaveStatus = async (
  id: string,
  status: string,
  rejectionReason?: string,
) => {
  const response = await api.put(`/leaves/admin/${id}/status`, {
    status,
    rejectionReason,
  });
  return response.data;
};

export const getLeaveApplications = async (status = 'PENDING') => {
  const response = await api.get('/leaves/admin/applications', {
    params: { status },
  });
  return response.data;
};

export const getLeaveStatistics = async (year?: number) => {
  const response = await api.get('/leaves/admin/statistics', {
    params: { year },
  });
  return response.data;
};

// New: Admin overview used by LeaveApplicationsOverview
export const getLeaveApplicationsOverview = async (year?: number) => {
  const response = await api.get('/leaves/admin/applications-overview', {
    params: { year },
  });
  return response.data;
};

// ================= ADMIN LEAVE BALANCES =================

export const getAdminLeaveBalances = async (year?: number) => {
  const response = await api.get('/leaves/admin/balances', {
    params: { year },
  });
  return response.data;
};

export const initAllUserLeaveBalances = async (year: number) => {
  const response = await api.post('/leaves/admin/balances/initialize-all', {
    year,
  });
  return response.data;
};

export const initSingleUserLeaveBalances = async (
  userId: string,
  year: number,
) => {
  const response = await api.post(
    `/leaves/admin/balances/initialize-user/${userId}`,
    { year },
  );
  return response.data;
};

export const updateLeaveBalanceAdmin = async (
  balanceId: string,
  balance: number,
) => {
  const response = await api.put(`/leaves/admin/balances/${balanceId}`, {
    balance,
  });
  return response.data;
};
