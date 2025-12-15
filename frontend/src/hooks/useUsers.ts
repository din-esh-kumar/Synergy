// src/hooks/useUsers.ts
import { useState, useEffect, useCallback } from 'react';
import userService from '../services/user.service';
import { User } from '../types/user.types';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // getAllUsers returns User[]
      const rawUsers = await userService.getAllUsers();

      const mapped: User[] = rawUsers.map((u: any) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        createdAt: u.createdAt,
        status: u.status ?? true,
      }));

      setUsers(mapped);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Failed to fetch users';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
};
