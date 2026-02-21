export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  phone?: string;
  designation?: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  phone?: string;
  designation?: string;
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
  designation?: string;
  role?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  status?: boolean;
}
