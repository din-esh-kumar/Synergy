import { useState, useEffect } from 'react';
import userService from '../services/user.service';
import { User } from '../types/user.types';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data: User[] = await userService.getAllUsers();
        // If backend already returns {_id,name,email,role} you can even skip mapping
        const mappedUsers: User[] = data.map(u => ({
          _id: u._id,          // assume backend always sends id
          name: u.name,
          email: u.email,
          role: u.role,
          avatar: u.avatar,
          createdAt: u.createdAt,
        }));
        setUsers(mappedUsers);
      } catch (error) {
        console.error('Failed to fetch users', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading };
};
