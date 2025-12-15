// src/types/user.types.ts

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'INTERN';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: boolean;
  avatar?: string;

  // add these fields so TS knows about them
  phone?: string;
  designation?: string;
  place?: string;
  

  createdAt?: string;
  updatedAt?: string;
}
