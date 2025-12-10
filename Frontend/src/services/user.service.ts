// src/services/user.service.ts

import api from '../config/api';
import { User } from "../types/user.types";

export const userService = {
  /**
   * Generic user list – used by MeetingForm, TeamForm, manager views, etc.
   * Backend: GET /api/users  (mounted from user.routes.ts)
   */
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get("/users");
      console.log("GET /users response:", response.data);

      // Accept either { data: User[] } or plain User[]
      const data = (response.data?.data ?? response.data) as User[] | undefined;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  /**
   * DM users list – currently same as getAllUsers, but kept separate
   * in case you later filter to only active users, same team, etc.
   * Backend: GET /api/users
   */
  getDmUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get("/users");
      console.log("GET /users (dm users) response:", response.data);

      const data = (response.data?.data ?? response.data) as User[] | undefined;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching DM users:", error);
      return [];
    }
  },

  /**
   * ADMIN endpoints – now use /admin/users/manage...
   * These should only be called from admin screens.
   */

  getUserById: async (id: string): Promise<User | null> => {
    try {
      const response = await api.get(`/admin/users/manage/${id}`);
      return (response.data?.user || null) as User | null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  },

  createUser: async (data: User): Promise<User | null> => {
    try {
      const response = await api.post("/admin/users/manage", data);
      return (response.data?.user || null) as User | null;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  updateUser: async (
    id: string,
    data: Partial<User>
  ): Promise<User | null> => {
    try {
      const response = await api.put(`/admin/users/manage/${id}`, data);
      return (response.data?.user || null) as User | null;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  deleteUser: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/admin/users/manage/${id}`);
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  },
};

export default userService;
