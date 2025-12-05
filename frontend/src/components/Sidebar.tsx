import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  CheckSquare,
  Briefcase,
  Users,
  Settings,
  LogOut,
  MessageCircle,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/meetings', icon: Calendar, label: 'Meetings', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/projects', icon: Briefcase, label: 'Projects', roles: ['ADMIN', 'MANAGER'] },
    { path: '/issues', icon: CheckSquare, label: 'Issues', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/teams', icon: Users, label: 'Teams', roles: ['ADMIN', 'MANAGER'] },
    { path: '/admin/users', icon: Users, label: 'User', roles: ['ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user?.role || 'EMPLOYEE'));
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40" onClick={onClose} />}

      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white text-slate-900 dark:bg-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 transition-transform duration-300 z-50 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h2 className="text-xl font-bold">Menu</h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
              <span className="sr-only">Close</span>
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Messages, Chat, Notifications & Settings */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
            {/* Messages */}
            <Link
              to="/messages"
              onClick={() => onClose()}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/messages')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageCircle size={20} />
              <span className="font-medium">Messages</span>
            </Link>


            {/* Notifications */}
            <Link
              to="/notifications"
              onClick={() => onClose()}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell size={20} />
              <span className="font-medium">Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Settings */}
            <Link
              to="/settings"
              onClick={() => onClose()}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/settings')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </Link>
          </div>

          {/* User Info & Logout */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2 mt-auto">
            <div className="px-4 py-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role}</p>
            </div>
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
