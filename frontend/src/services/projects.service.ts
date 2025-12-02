// src/services/projects.service.ts
import axiosInstance from './api';
import {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
} from '../types/project.types';

const projectsService = {
  // Create project
  createProject: async (
    data: CreateProjectPayload
  ): Promise<Project> => {
    const response = await axiosInstance.post('/projects', data);
    const res = response.data;
    return (res?.project || res?.data) as Project;
  },

  // Get all projects
  getProjects: async (filters?: {
    status?: string;
    visibility?: string;
  }): Promise<Project[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.visibility) params.append('visibility', filters.visibility);

    const query = params.toString();
    const url = query ? `/projects?${query}` : '/projects';

    const response = await axiosInstance.get(url);
    const res = response.data;
    if (Array.isArray(res?.projects)) return res.projects as Project[];
    if (Array.isArray(res?.data)) return res.data as Project[];
    if (Array.isArray(res)) return res as Project[];
    return [];
  },

  // Get single project
  getProject: async (id: string): Promise<Project | null> => {
    const response = await axiosInstance.get(`/projects/${id}`);
    const res = response.data;
    return (res?.project || res?.data || null) as Project | null;
  },

  // Update project
  updateProject: async (
    id: string,
    data: UpdateProjectPayload
  ): Promise<Project> => {
    const response = await axiosInstance.put(`/projects/${id}`, data);
    const res = response.data;
    return (res?.project || res?.data) as Project;
  },

  // Delete project
  deleteProject: async (id: string): Promise<boolean> => {
    await axiosInstance.delete(`/projects/${id}`);
    return true;
  },

  // Add team member
  addTeamMember: async (
    id: string,
    userId: string
  ): Promise<Project> => {
    const response = await axiosInstance.post(`/projects/${id}/team`, {
      userId,
    });
    const res = response.data;
    return (res?.project || res?.data) as Project;
  },
};

export default projectsService;
