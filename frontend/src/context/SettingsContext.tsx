// src/context/SettingsContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface Settings {
  notifications: Record<string, boolean>;
  theme: 'light' | 'dark' | 'auto';
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  loadSettings: () => Promise<void>;
  updateNotifications: (notifications: Record<string, boolean>) => Promise<void>;
  updateTheme: (theme: 'light' | 'dark' | 'auto') => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings', error);
      // Default settings on error
      setSettings({
        notifications: {
          email: true,
          push: true,
          teamChat: true,
          projectChat: true,
          taskChat: true,
          meetings: true,
          issues: true,
          dailyDigest: true,
        },
        theme: 'auto',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const updateNotifications = useCallback(async (notifications: Record<string, boolean>) => {
    try {
      await api.patch('/settings/notifications', { notifications });
      setSettings(prev => prev ? { ...prev, notifications } : null);
    } catch (error) {
      console.error('Error updating notifications', error);
    }
  }, []);

  const updateTheme = useCallback(async (theme: 'light' | 'dark' | 'auto') => {
    try {
      await api.patch('/settings/theme', { theme });
      setSettings(prev => prev ? { ...prev, theme } : null);
    } catch (error) {
      console.error('Error updating theme', error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <SettingsContext.Provider value={{
      settings, loading, loadSettings, updateNotifications, updateTheme
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
