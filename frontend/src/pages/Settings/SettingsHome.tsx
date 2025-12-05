// src/pages/settings/SettingsPage.tsx
import React, { useEffect } from 'react';
import ProfileSettings from '../../components/Settings/ProfileSettings';
import ThemeSettings from '../../components/Settings/ThemeSettings';
import NotificationSettings from '../../components/Settings/NotificationSettings';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { loadSettings } = useSettings();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-pulse bg-slate-200 dark:bg-slate-700 w-24 h-24 rounded-full mx-auto mb-4" />
          <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-8 w-48 mx-auto mb-2" />
          <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-slate-800 dark:from-white dark:to-slate-100 bg-clip-text text-transparent mb-3">
            Settings
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Manage your profile, notifications, and preferences
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ProfileSettings />
        <ThemeSettings />
        <NotificationSettings />
      </div>
    </div>
  );
};

export default SettingsPage;
