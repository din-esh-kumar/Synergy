import api from './api';

export interface User {
  _id?: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  avatar?: string;
  createdAt?: string;
}

export const userService = {
  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get('/users');
      return response.data?.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User | null> => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data?.user || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  // Create user
  createUser: async (data: User): Promise<User | null> => {
    try {
      const response = await api.post('/users', data);
      return response.data?.user || null;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  updateUser: async (id: string, data: Partial<User>): Promise<User | null> => {
    try {
      const response = await api.put(`/users/${id}`, data);
      return response.data?.user || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/users/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  },
};

export default userService;
