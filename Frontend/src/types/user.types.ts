// src/types/user.types.ts

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt?: string;
}
