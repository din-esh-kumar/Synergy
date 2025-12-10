// src/services/issue.service.ts
import api from '../config/api';
import {
  IIssue,
  CreateIssuePayload,
  UpdateIssuePayload,
} from '../types/issue.types';

// Shape of backend list response: { success, count, data }
interface IssueListResponse {
  success: boolean;
  count: number;
  data: IIssue[];
}

// Shape of backend single-item response: { success, data }
interface IssueItemResponse {
  success: boolean;
  data: IIssue;
}

// Shape of delete response: { success, message }
interface IssueDeleteResponse {
  success: boolean;
  message: string;
}

export const issueService = {
  // Get issues with filters
  async getIssues(params?: {
    projectId?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    team?: string;
  }): Promise<IIssue[]> {
    try {
      const response = await api.get<IssueListResponse>('/issues', { params });
      // backend: { success, count, data }
      return response.data?.data ?? [];
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Get single issue
  async getIssueById(id: string): Promise<IIssue> {
    try {
      const response = await api.get<IssueItemResponse>(`/issues/${id}`);
      return response.data?.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Create issue
  async createIssue(payload: CreateIssuePayload): Promise<IIssue> {
    try {
      const response = await api.post<IssueItemResponse>('/issues', payload);
      return response.data?.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Update issue
  async updateIssue(id: string, payload: UpdateIssuePayload): Promise<IIssue> {
    try {
      const response = await api.put<IssueItemResponse>(`/issues/${id}`, payload);
      return response.data?.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Delete issue
  async deleteIssue(id: string): Promise<IssueDeleteResponse> {
    try {
      const response = await api.delete<IssueDeleteResponse>(`/issues/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};
