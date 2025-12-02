// src/services/tasks.service.ts
import axiosInstance from './api';
import { Task, CreateTaskPayload, UpdateTaskPayload } from '../types/task.types';

const tasksService = {
  // Create task
  createTask: async (data: CreateTaskPayload): Promise<Task> => {
    const response = await axiosInstance.post('/tasks', data);
    const res = response.data;
    return (res?.task || res?.data) as Task;
  },

  // Get all tasks
  getTasks: async (filters?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
  }): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);

    const query = params.toString();
    const url = query ? `/tasks?${query}` : '/tasks';

    const response = await axiosInstance.get(url);
    const res = response.data;
    if (Array.isArray(res?.tasks)) return res.tasks as Task[];
    if (Array.isArray(res?.data)) return res.data as Task[];
    if (Array.isArray(res)) return res as Task[];
    return [];
  },

  // Get single task
  getTask: async (id: string): Promise<Task | null> => {
    const response = await axiosInstance.get(`/tasks/${id}`);
    const res = response.data;
    return (res?.task || res?.data || null) as Task | null;
  },

  // Update task
  updateTask: async (
    id: string,
    data: UpdateTaskPayload
  ): Promise<Task> => {
    const response = await axiosInstance.put(`/tasks/${id}`, data);
    const res = response.data;
    return (res?.task || res?.data) as Task;
  },

  // Delete task
  deleteTask: async (id: string): Promise<boolean> => {
    await axiosInstance.delete(`/tasks/${id}`);
    return true;
  },

  // Add comment
  addComment: async (
    id: string,
    text: string
  ): Promise<Task> => {
    const response = await axiosInstance.post(`/tasks/${id}/comments`, { text });
    const res = response.data;
    return (res?.task || res?.data) as Task;
  },
};

export default tasksService;
