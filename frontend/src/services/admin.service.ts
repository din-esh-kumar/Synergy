import axiosInstance from './api';
import {
  AdminUser,
  CreateUserPayload,
  UpdateUserPayload,
} from '../types/admin.types';

const adminService = {
  // Create user
  createUser: async (data: CreateUserPayload): Promise<AdminUser> => {
    const response = await axiosInstance.post('/admin/users', data);
    return response.data.data;
  },

  // Get all users
  getAllUsers: async (filters?: {
    role?: string;
    search?: string;
  }): Promise<AdminUser[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.search) params.append('search', filters.search);

    const response = await axiosInstance.get(`/admin/users?${params.toString()}`);
    return response.data.data;
  },

  // Get single user
  getUser: async (id: string): Promise<AdminUser> => {
    const response = await axiosInstance.get(`/admin/users/${id}`);
    return response.data.data;
  },

  // Update user
  updateUser: async (id: string, data: UpdateUserPayload): Promise<AdminUser> => {
    const response = await axiosInstance.put(`/admin/users/${id}`, data);
    return response.data.data;
  },

  // Delete user
  deleteUser: async (id: string): Promise<boolean> => {
    await axiosInstance.delete(`/admin/users/${id}`);
    return true;
  },

  // Assign role
  assignRole: async (
    id: string,
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  ): Promise<AdminUser> => {
    const response = await axiosInstance.patch(`/admin/users/${id}/role`, {
      role,
    });
    return response.data.data;
  },
};

export default adminService;
