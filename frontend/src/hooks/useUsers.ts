import { useState, useEffect } from 'react';
import { userService } from '../services/user.service';
import { User as TypeUser } from '../types/user.types';
import { User as ServiceUser } from '../services/user.service';

export const useUsers = () => {
  const [users, setUsers] = useState<TypeUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data: ServiceUser[] = await userService.getAllUsers();
        // Map service users to frontend User type
        const mappedUsers: TypeUser[] = data.map(u => ({
          _id: u._id || '', // ensure _id is a string
          name: u.name,
          email: u.email,
          role: u.role,
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
