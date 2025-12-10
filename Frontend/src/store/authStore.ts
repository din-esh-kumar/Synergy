import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../config/api';
import type { User, LoginCredentials, RegisterData } from '../types';
import toast from 'react-hot-toast';

const showToast = (
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
) => {
  switch (type) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    case 'info':
      toast(message);
      break;
  }
};

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  lastApiCall: { [key: string]: number };

  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshAccessToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setAuthToken: (
    accessToken: string,
    user?: User,
    refreshToken?: string | null,
  ) => void;

  shouldMakeApiCall: (action: string, cooldownMs?: number) => boolean;
}

const API_COOLDOWNS = {
  login: 2000,
  register: 3000,
  refresh: 10000,
  update: 2000,
  default: 1000,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      lastApiCall: {},

      shouldMakeApiCall: (action: string, cooldownMs?: number) => {
        const cooldown =
          cooldownMs ||
          API_COOLDOWNS[action as keyof typeof API_COOLDOWNS] ||
          API_COOLDOWNS.default;
        const lastCall = get().lastApiCall[action];
        const now = Date.now();

        if (lastCall && now - lastCall < cooldown) {
          showToast('Please wait before trying again', 'info');
          return false;
        }

        set(state => ({
          lastApiCall: { ...state.lastApiCall, [action]: now },
        }));

        return true;
      },

      // Login
      login: async credentials => {
        try {
          if (!get().shouldMakeApiCall('login')) {
            return;
          }

          set({ loading: true, error: null });

          const response = await apiClient.post('/api/auth/login', credentials);
          const { user, accessToken, refreshToken } = response.data.data;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            loading: false,
          });

          apiClient.defaults.headers.common.Authorization =
            `Bearer ${accessToken}`;
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || 'Login failed';

          if (
            errorMessage.toLowerCase().includes('email') ||
            errorMessage.toLowerCase().includes('user')
          ) {
            showToast('Please check your email and password', 'error');
          } else if (error.response?.status === 429) {
            showToast('Too many attempts. Please try again later.', 'error');
          } else {
            showToast(errorMessage, 'error');
          }

          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Register
      register: async data => {
        try {
          if (!get().shouldMakeApiCall('register')) {
            return;
          }

          set({ loading: true, error: null });

          const response = await apiClient.post('/api/auth/register', data);

          const message =
            response.data?.message ||
            'Registration successful! Please check your email.';
          showToast(message, 'success');

          set({
            loading: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || 'Registration failed';

          if (
            errorMessage.toLowerCase().includes('email') &&
            errorMessage.toLowerCase().includes('already')
          ) {
            showToast(
              'This email is already registered. Please try logging in.',
              'info',
            );
          } else if (error.response?.status === 429) {
            showToast('Too many attempts. Please try again later.', 'error');
          } else {
            showToast(errorMessage, 'error');
          }

          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Logout
      logout: () => {
        const user = get().user;

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });

        delete apiClient.defaults.headers.common.Authorization;

        if (user) {
          showToast(`Goodbye, ${user.firstName || 'User'}!`, 'info');
        }
      },

      clearError: () => set({ error: null }),

      // Refresh token
      refreshAccessToken: async () => {
        try {
          if (!get().shouldMakeApiCall('refresh', 30000)) {
            return;
          }

          const refreshToken = get().refreshToken;
          if (!refreshToken) throw new Error('No refresh token found');

          const response = await apiClient.post('/api/auth/refresh', {
            refreshToken,
          });
          const { accessToken } = response.data.data;

          set({ accessToken, isAuthenticated: true });
          apiClient.defaults.headers.common.Authorization =
            `Bearer ${accessToken}`;
        } catch (_error: any) {
          get().logout();
        }
      },

      // Update profile
      updateProfile: async data => {
        try {
          if (!get().shouldMakeApiCall('update')) {
            return;
          }

          set({ loading: true, error: null });

          const response = await apiClient.patch('/api/user/profile', data);
          const { data: updatedUser, message } = response.data;

          if (message.includes('already exists')) {
            throw new Error(message);
          }

          set({ user: updatedUser, loading: false });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            'Update failed';
          toast.error(errorMessage);
          set({ loading: false });
          throw error;
        }
      },

      // Manual set (Google, etc.)
      setAuthToken: (accessToken, user, refreshToken = null) => {
        set({
          accessToken,
          refreshToken,
          user: user || null,
          isAuthenticated: true,
          loading: false,
        });

        apiClient.defaults.headers.common.Authorization =
          `Bearer ${accessToken}`;

        if (user) {
          showToast(`Welcome, ${user.firstName || user.email}!`, 'success');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
