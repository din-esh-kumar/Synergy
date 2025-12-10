// src/services/settings.service.ts
import api from '../config/api';

export interface SettingsResponse {
  profile?: {
    name: string;
    email: string;
    role: string;
    phone?: string;
    avatar?: string;
  };
  notifications?: Record<string, boolean>;
  theme?: "light" | "dark" | "auto";
}

export const settingsService = {
  getSettings: () => api.get<SettingsResponse>("/settings"),

  updateTheme: (theme: "light" | "dark" | "auto") =>
    api.patch("/settings/theme", { theme }),

  updateNotifications: (notifications: Record<string, boolean>) =>
    api.patch("/settings/notifications", { notifications }),

  // NEW: update profile fields that are editable
  updateProfile: (payload: { name: string; phone?: string; avatarUrl?: string }) =>
    api.patch("/settings/profile", payload),
};

export default settingsService;
