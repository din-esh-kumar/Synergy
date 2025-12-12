// src/services/approval.service.ts - UNIFIED APPROVALS
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const getPendingApprovals = async (type?: string) => {
  const response = await axios.get(`${API_URL}/approvals/pending`, { params: { type } });
  return response.data;
};

export const approveRequest = async (type: string, id: string) => {
  const response = await axios.put(`${API_URL}/approvals/${type}/${id}/approve`);
  return response.data;
};

export const rejectRequest = async (type: string, id: string, rejectionReason: string) => {
  const response = await axios.put(`${API_URL}/approvals/${type}/${id}/reject`, {
    rejectionReason
  });
  return response.data;
};
