// src/components/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Users,
  Folder,
  CheckSquare,
  AlertCircle,
  Calendar,
  MessageSquare,
  Bell,
  Settings,
  CalendarDays,
  CreditCard,
  Clock,
  CheckCircle,
  Shield,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const synergyNavItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/teams', icon: Users, label: 'Teams', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/projects', icon: Folder, label: 'Projects', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/issues', icon: AlertCircle, label: 'Issues', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/meetings', icon: Calendar, label: 'Meetings', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/messages', icon: MessageSquare, label: 'Messages', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  ];

  const emsNavItems = [
    { path: '/leaves', icon: CalendarDays, label: 'Leaves', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/expenses', icon: CreditCard, label: 'Expenses', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/timesheets', icon: Clock, label: 'Timesheets', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/approvals', icon: CheckCircle, label: 'Approvals', roles: ['ADMIN', 'MANAGER'] },
  ];

  const adminNavItems = [
    { path: '/admin', icon: Shield, label: 'Admin Panel', roles: ['ADMIN'] },
  ];

  const generalNavItems = [
    { path: '/notifications', icon: Bell, label: 'Notifications', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/settings', icon: Settings, label: 'Settings', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  ];

  const canAccess = (roles: string[]) => roles.includes(user?.role || '');

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Navigation</h2>
            <button
              onClick={onClose}
              className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Synergy Section */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Project Management
              </h3>
              <div className="space-y-1">
                {synergyNavItems.filter(item => canAccess(item.roles)).map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>

            {/* EMS Section */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Employee Management
              </h3>
              <div className="space-y-1">
                {emsNavItems.filter(item => canAccess(item.roles)).map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Admin Section */}
            {canAccess(['ADMIN']) && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Administration
                </h3>
                <div className="space-y-1">
                  {adminNavItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )}

            {/* General Section */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                General
              </h3>
              <div className="space-y-1">
                {generalNavItems.filter(item => canAccess(item.roles)).map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
