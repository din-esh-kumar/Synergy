import axiosInstance from '../config/api';
import {
  AdminUser,
  CreateUserPayload,
  UpdateUserPayload,
} from '../types/admin.types';

const adminService = {
  // Create user
  createUser: async (data: CreateUserPayload): Promise<AdminUser> => {
    const response = await axiosInstance.post('/admin/users/manage', data);
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

    const query = params.toString();
    const url = query
      ? `/admin/users/manage?${query}`
      : '/admin/users/manage';

    const response = await axiosInstance.get(url);
    return response.data.data;
  },

  // Get single user
  getUser: async (id: string): Promise<AdminUser> => {
    const response = await axiosInstance.get(`/admin/users/manage/${id}`);
    return response.data.data;
  },

  // Update user
  updateUser: async (id: string, data: UpdateUserPayload): Promise<AdminUser> => {
    const response = await axiosInstance.put(`/admin/users/manage/${id}`, data);
    return response.data.data;
  },

  // Delete user
  deleteUser: async (id: string): Promise<boolean> => {
    await axiosInstance.delete(`/admin/users/manage/${id}`);
    return true;
  },

  // Assign role
  assignRole: async (
    id: string,
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  ): Promise<AdminUser> => {
    // Your backend currently uses PATCH /manage/:id/status;
    // there is no /role route, so keep using updateUser or add a new backend route.
    const response = await axiosInstance.put(`/admin/users/manage/${id}`, {
      role,
    });
    return response.data.data;
  },
};

export default adminService;
