// src/components/Layout/Sidebar.tsx - UPDATED WITH EMS NAVIGATION
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  FolderIcon,
  CheckSquareIcon,
  AlertCircleIcon,
  CalendarIcon,
  MessageSquareIcon,
  BellIcon,
  SettingsIcon,
  // EMS Icons (New)
  CalendarDaysIcon,
  CreditCardIcon,
  ClockIcon,
  CheckCircleIcon,
  FileTextIcon,
  ShieldCheckIcon
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER' || isAdmin;

  const synergyNavItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/teams', icon: UsersIcon, label: 'Teams', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/projects', icon: FolderIcon, label: 'Projects', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/tasks', icon: CheckSquareIcon, label: 'Tasks', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/issues', icon: AlertCircleIcon, label: 'Issues', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/meetings', icon: CalendarIcon, label: 'Meetings', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/messages', icon: MessageSquareIcon, label: 'Messages', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  ];

  const emsNavItems = [
    { path: '/leaves', icon: CalendarDaysIcon, label: 'Leaves', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/expenses', icon: CreditCardIcon, label: 'Expenses', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/timesheets', icon: ClockIcon, label: 'Timesheets', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/approvals', icon: CheckCircleIcon, label: 'Approvals', roles: ['ADMIN', 'MANAGER'], badge: true },
  ];

  const adminNavItems = [
    { path: '/admin/users', icon: ShieldCheckIcon, label: 'User Management', roles: ['ADMIN', 'MANAGER'] },
    { path: '/admin/ems', icon: SettingsIcon, label: 'EMS Settings', roles: ['ADMIN'] },
    { path: '/export', icon: FileTextIcon, label: 'Export Data', roles: ['ADMIN', 'MANAGER'] },
  ];

  const generalNavItems = [
    { path: '/notifications', icon: BellIcon, label: 'Notifications', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/settings', icon: SettingsIcon, label: 'Settings', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  ];

  const canAccess = (roles: string[]) => {
    return roles.includes(user?.role || '');
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen overflow-y-auto">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-8">
          Synergy
        </h2>

        {/* SYNERGY SECTION */}
        <nav className="space-y-1">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Project Management
            </h3>
            {synergyNavItems.map((item) =>
              canAccess(item.roles) ? (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              ) : null
            )}
          </div>

          {/* EMS SECTION (NEW) */}
          <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Employee Management
            </h3>
            {emsNavItems.map((item) =>
              canAccess(item.roles) ? (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-2 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </div>
                  {item.badge && isManager && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                </NavLink>
              ) : null
            )}
          </div>

          {/* ADMIN SECTION */}
          {isManager && (
            <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Administration
              </h3>
              {adminNavItems.map((item) =>
                canAccess(item.roles) ? (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </NavLink>
                ) : null
              )}
            </div>
          )}

          {/* GENERAL SECTION */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            {generalNavItems.map((item) =>
              canAccess(item.roles) ? (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              ) : null
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
