import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Settings, Moon, Sun, Menu } from 'lucide-react';
import NotificationBell from './Notifications/NotificationBell';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme(); // updated
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Custom toggle for light/dark
  const handleToggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('light');
    else setTheme('dark'); // default for 'auto'
  };

  return (
    <nav className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          WorkHub
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <NotificationBell />

        {/* Theme Toggle */}
        <button
          onClick={handleToggleTheme} // updated
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun size={20} className="text-yellow-400" />
          ) : (
            <Moon size={20} className="text-slate-700" />
          )}
        </button>

        {/* Settings */}
        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Settings size={20} />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <img
              src={user?.avatarUrl || 'https://via.placeholder.com/40'}
              alt={user?.name}
              className="w-8 h-8 rounded-full border-2 border-blue-500"
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
