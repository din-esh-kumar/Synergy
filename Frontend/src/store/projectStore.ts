import { create } from 'zustand';
import apiClient from '../config/api';
import type { Project, ApiResponse, CreateProjectData, UpdateProjectData } from '../types';

interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchProjectsIsActive: () => Promise<void>;
  getProject: (id: string) => Promise<Project | null>;
  createProject: (data: CreateProjectData) => Promise<Project | null>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  loading: false,
  error: null,

  // GET /api/projects
  fetchProjects: async () => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.get<ApiResponse<Project[]>>('/api/projects');
      set({ projects: response.data.data || [], loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch projects', loading: false });
    }
  },

  fetchProjectsIsActive: async () => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.get<ApiResponse<Project[]>>('/api/projects?isActive=true');
      set({ projects: response.data.data || [], loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch projects', loading: false });
    }
  },

  // GET /api/projects/:id
  getProject: async (id) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.get<ApiResponse<Project>>(`/api/projects/${id}`);
      set({ loading: false });
      return response.data.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to get project', loading: false });
      return null;
    }
  },

  // POST /api/projects
  createProject: async (data) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.post<ApiResponse<Project>>('/api/projects', data);
      set((state) => ({
        projects: [response.data.data, ...state.projects],
        loading: false,
      }));
      return response.data.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create project', loading: false });
      return null;
    }
  },

  // PATCH /api/projects/:id
  updateProject: async (id, data) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.patch<ApiResponse<Project>>(`/api/projects/${id}`, data);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? response.data.data : p)),
        loading: false,
      }));
      return response.data.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update project', loading: false });
      return null;
    }
  },

  // DELETE /api/projects/:id
  deleteProject: async (id) => {
    try {
      set({ loading: true, error: null });
      await apiClient.delete(`/api/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        loading: false,
      }));
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete project', loading: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
