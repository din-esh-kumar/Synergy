// src/services/issue.service.ts
import api from './api';
import {
  // IIssue,
  CreateIssuePayload,
  UpdateIssuePayload,
} from '../types/issue.types';

export const issueService = {
  // Get issues with filters
  async getIssues(params?: {
    projectId?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    team?: string;
  }) {
    try {
      const response = await api.get('/issues', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Get single issue
  async getIssueById(id: string) {
    try {
      const response = await api.get(`/issues/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Create issue
  async createIssue(payload: CreateIssuePayload) {
    try {
      const response = await api.post('/issues', payload);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Update issue
  async updateIssue(id: string, payload: UpdateIssuePayload) {
    try {
      const response = await api.put(`/issues/${id}`, payload);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Delete issue
  async deleteIssue(id: string) {
    try {
      const response = await api.delete(`/issues/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};
