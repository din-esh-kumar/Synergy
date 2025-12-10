// src/services/api.ts
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_BASE_URL = "http://localhost:8001/";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30s for bulk operations
});

// REQUEST INTERCEPTOR – attach token from Zustand store
api.interceptors.request.use(
  config => {
    const { accessToken } = useAuthStore.getState();

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Longer timeout for heavy initialization endpoints
    if (
      config.url?.includes("/initialize-all-balances") ||
      config.url?.includes("/initialize-user-balances")
    ) {
      config.timeout = 60000;
    }

    return config;
  },
  error => Promise.reject(error)
);

// RESPONSE INTERCEPTOR – handle token refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(p => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest: any = error.config;
    const { refreshAccessToken, logout } = useAuthStore.getState();

    // Only handle 401 once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await refreshAccessToken();
        const { accessToken } = useAuthStore.getState();

        processQueue(null, accessToken);

        if (accessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        logout();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
