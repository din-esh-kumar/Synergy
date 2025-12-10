import { useState, useEffect } from "react";
import settingsService from "../../services/settings.service";
import Loader from "../common/Loader";

type Notifications = Record<string, boolean>;

interface Settings {
  notifications: Notifications;
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await settingsService.getSettings();
        const data = response.data as Partial<Settings>;

        // Ensure we always have a notifications object
        const notifications: Notifications = {
          email: data?.notifications?.email ?? true,
          push: data?.notifications?.push ?? true,
          teamChat: data?.notifications?.teamChat ?? true,
          projectChat: data?.notifications?.projectChat ?? true,
          taskChat: data?.notifications?.taskChat ?? true,
          meetings: data?.notifications?.meetings ?? true,
          issues: data?.notifications?.issues ?? true,
          dailyDigest: data?.notifications?.dailyDigest ?? true,
        };

        setSettings({ notifications });
      } catch (error) {
        console.error("Error loading settings", error);

        // Fallback defaults if API fails
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
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleToggle = async (key: string) => {
    if (!settings) return;

    try {
      const notifications: Notifications = {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      };

      await settingsService.updateNotifications(notifications);
      setSettings({ notifications });
    } catch (error) {
      console.error("Error updating settings", error);
    }
  };

  if (loading || !settings || !settings.notifications) {
    return <Loader />;
  }

  const toggleOptions = [
    { key: "email", label: "Email Notifications" },
    { key: "push", label: "Push Notifications" },
    { key: "teamChat", label: "Team Chat Messages" },
    { key: "projectChat", label: "Project Chat Messages" },
    { key: "taskChat", label: "Task Chat Messages" },
    { key: "meetings", label: "Meeting Reminders" },
    { key: "issues", label: "Issue Updates" },
    { key: "dailyDigest", label: "Daily Digest" },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Notification Settings
      </h2>
      <div className="space-y-4">
        {toggleOptions.map(({ key, label }) => {
          const isOn = settings.notifications[key] ?? false;

          return (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-900 dark:text-white">{label}</span>
              <button
                onClick={() => handleToggle(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isOn
                    ? "bg-blue-600"
                    : "bg-gray-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isOn ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
