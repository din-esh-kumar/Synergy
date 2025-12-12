// src/services/timesheet.service.ts - TIMESHEET DATA ACCESS
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Employee Timesheet Services
export const createTimesheet = async (timesheetData: any) => {
  const response = await axios.post(`${API_URL}/timesheets`, timesheetData);
  return response.data;
};

export const getMyTimesheets = async (filters?: any) => {
  const response = await axios.get(`${API_URL}/timesheets/my-timesheets`, { params: filters });
  return response.data;
};

export const getTimesheetById = async (id: string) => {
  const response = await axios.get(`${API_URL}/timesheets/${id}`);
  return response.data;
};

export const updateTimesheet = async (id: string, timesheetData: any) => {
  const response = await axios.put(`${API_URL}/timesheets/${id}`, timesheetData);
  return response.data;
};

export const deleteTimesheet = async (id: string) => {
  const response = await axios.delete(`${API_URL}/timesheets/${id}`);
  return response.data;
};

export const submitTimesheet = async (id: string) => {
  const response = await axios.post(`${API_URL}/timesheets/${id}/submit`);
  return response.data;
};

// Admin/Manager Timesheet Services
export const getAllTimesheets = async (filters?: any) => {
  const response = await axios.get(`${API_URL}/timesheets/admin/all`, { params: filters });
  return response.data;
};

export const approveTimesheet = async (id: string) => {
  const response = await axios.put(`${API_URL}/timesheets/admin/${id}/approve`);
  return response.data;
};

export const rejectTimesheet = async (id: string, rejectionReason: string) => {
  const response = await axios.put(`${API_URL}/timesheets/admin/${id}/reject`, { rejectionReason });
  return response.data;
};
