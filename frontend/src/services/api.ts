// src/services/api.ts

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: false,
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('synergy_token') ||
    localStorage.getItem('token');

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
