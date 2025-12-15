// src/services/timesheet.service.ts - TIMESHEET DATA ACCESS

import api from './api';

// Employee Timesheet Services

export const createTimesheet = async (timesheetData: any) => {
  const response = await api.post('/timesheets', timesheetData);
  return response.data;
};

export const getMyTimesheets = async (filters?: any) => {
  const response = await api.get('/timesheets/my-timesheets', {
    params: filters,
  });
  return response.data;
};

export const getTimesheetById = async (id: string) => {
  const response = await api.get(`/timesheets/${id}`);
  return response.data;
};

export const updateTimesheet = async (id: string, timesheetData: any) => {
  const response = await api.put(`/timesheets/${id}`, timesheetData);
  return response.data;
};

export const deleteTimesheet = async (id: string) => {
  const response = await api.delete(`/timesheets/${id}`);
  return response.data;
};

export const submitTimesheet = async (id: string) => {
  const response = await api.post(`/timesheets/${id}/submit`);
  return response.data;
};

// Admin / Manager Timesheet Services

export const getAllTimesheets = async (filters?: any) => {
  const response = await api.get('/timesheets/admin/all', {
    params: filters,
  });
  return response.data;
};

export const approveTimesheet = async (id: string) => {
  const response = await api.put(`/timesheets/admin/${id}/approve`);
  return response.data;
};

export const rejectTimesheet = async (id: string, rejectionReason: string) => {
  const response = await api.put(`/timesheets/admin/${id}/reject`, {
    rejectionReason,
  });
  return response.data;
};

// Optional: stats for dashboard widgets
export const getTimesheetStats = async (startDate?: string, endDate?: string) => {
  const response = await api.get('/timesheets/admin/stats', {
    params: { startDate, endDate },
  });
  return response.data;
};
