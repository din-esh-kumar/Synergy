// src/components/settings/ThemeSettings.tsx
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const { updateTheme } = useSettings();
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'auto'>(theme);

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    try {
      setSelectedTheme(newTheme);
      setTheme(newTheme);
      await updateTheme(newTheme);
    } catch (error) {
      console.error('Error updating theme', error);
    }
  };

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'auto' as const, label: 'Auto', icon: Monitor },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 col-span-1">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Theme Settings
      </h2>
      
      <div className="space-y-3">
        {themes.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 group hover:shadow-md ${
              selectedTheme === value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={selectedTheme === value}
              onChange={() => handleThemeChange(value)}
              className="sr-only"
            />
            <Icon size={24} className={`mr-4 flex-shrink-0 ${selectedTheme === value ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
            <span className="text-gray-900 dark:text-white font-medium">{label}</span>
          </label>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        Auto follows your system preference
      </p>
    </div>
  );
}
