// src/services/user.service.ts
import api from "./api";
import { User } from "../types/user.types";

export const userService = {
  // Admin: Get all users
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get("/admin/users");
      console.log("GET /admin/users response:", response.data);
      return (response.data?.data || []) as User[];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  // NEW: DM users list (safe for employees) -> backend /api/users
  getDmUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get("/users");
      console.log("GET /users (dm users) response:", response.data);
      // assume backend returns users array directly or under data
      return (response.data?.data || response.data || []) as User[];
    } catch (error) {
      console.error("Error fetching DM users:", error);
      return [];
    }
  },

  getUserById: async (id: string): Promise<User | null> => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return (response.data?.user || null) as User | null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  },

  createUser: async (data: User): Promise<User | null> => {
    try {
      const response = await api.post("/admin/users", data);
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
      const response = await api.put(`/admin/users/${id}`, data);
      return (response.data?.user || null) as User | null;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  deleteUser: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/admin/users/${id}`);
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  },
};

export default userService;
