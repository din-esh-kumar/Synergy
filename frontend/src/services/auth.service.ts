import axiosInstance from './api';
import { LoginPayload, LoginResponse, RegisterPayload } from '../types/auth.types';

const authService = {
  login: async (data: LoginPayload): Promise<LoginResponse> => {
    const res = await axiosInstance.post('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterPayload): Promise<LoginResponse> => {
    const res = await axiosInstance.post('/auth/register', data);
    return res.data;
  },
};

export default authService;
