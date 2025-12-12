// src/services/leave.service.ts - DATA ACCESS LAYER
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Employee Leave Services
export const applyLeave = async (leaveData: any) => {
  const response = await axios.post(`${API_URL}/leaves/apply`, leaveData);
  return response.data;
};

export const getMyLeaves = async (filters?: any) => {
  const response = await axios.get(`${API_URL}/leaves/my-leaves`, { params: filters });
  return response.data;
};

export const getLeaveById = async (id: string) => {
  const response = await axios.get(`${API_URL}/leaves/${id}`);
  return response.data;
};

export const updateLeave = async (id: string, leaveData: any) => {
  const response = await axios.put(`${API_URL}/leaves/${id}`, leaveData);
  return response.data;
};

export const cancelLeave = async (id: string) => {
  const response = await axios.delete(`${API_URL}/leaves/${id}/cancel`);
  return response.data;
};

export const getLeaveBalance = async (year?: number) => {
  const response = await axios.get(`${API_URL}/leaves/balance`, { params: { year } });
  return response.data;
};

export const getLeaveHistory = async (page = 1, limit = 10) => {
  const response = await axios.get(`${API_URL}/leaves/history`, { params: { page, limit } });
  return response.data;
};

// Admin/Manager Leave Services
export const getAllLeaves = async (filters?: any) => {
  const response = await axios.get(`${API_URL}/leaves/admin/all`, { params: filters });
  return response.data;
};

export const updateLeaveStatus = async (id: string, status: string, rejectionReason?: string) => {
  const response = await axios.put(`${API_URL}/leaves/admin/${id}/status`, {
    status,
    rejectionReason
  });
  return response.data;
};

export const getLeaveApplications = async (status = 'PENDING') => {
  const response = await axios.get(`${API_URL}/leaves/admin/applications`, { params: { status } });
  return response.data;
};

export const getLeaveStatistics = async (year?: number) => {
  const response = await axios.get(`${API_URL}/leaves/admin/statistics`, { params: { year } });
  return response.data;
};
