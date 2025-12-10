import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
  onProfileClick: () => void;
  onLogoutClick: () => void;
}

interface NavItem {
  path: string;
  icon: string;
  text: string;
  roles: string[];
  badge?: number;
}

export default function Sidebar({ collapsed, onToggleCollapse, onClose, onProfileClick, onLogoutClick }: SidebarProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hr: true,
    work: true,
  });

  const avatarInitial =
    user?.firstName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'U';

  // Collapsible sections for better organization
  const navSections = [
    {
      id: 'main',
      title: 'MAIN',
      items: [
        { path: '/', icon: 'fas fa-home', text: 'Dashboard', roles: ['employee', 'manager', 'admin'] },
      ]
    },
    {
      id: 'hr',
      title: 'HR & ADMIN',
      collapsible: true,
      items: [
        { path: '/timesheets', icon: 'fas fa-clock', text: 'Timesheets', roles: ['employee', 'manager', 'admin'] },
        { path: '/expenses', icon: 'fas fa-receipt', text: 'Expenses', roles: ['employee', 'manager', 'admin'] },
        { path: '/leaves', icon: 'fas fa-calendar-day', text: 'Leaves', roles: ['employee', 'manager', 'admin'] },
        { path: '/approvals', icon: 'fas fa-check-double', text: 'Approvals', roles: ['manager', 'admin'] },
      ]
    },
    {
      id: 'work',
      title: 'WORK',
      collapsible: true,
      items: [
        { path: '/meetings', icon: 'fas fa-video', text: 'Meetings', roles: ['employee', 'manager', 'admin'] },
        { path: '/tasks', icon: 'fas fa-tasks', text: 'Tasks', roles: ['employee', 'manager', 'admin'] },
        { path: '/projects', icon: 'fas fa-folder', text: 'Projects', roles: ['employee', 'manager', 'admin'] },
        { path: '/teams', icon: 'fas fa-users', text: 'Teams', roles: ['employee', 'manager', 'admin'] },
        { path: '/issues', icon: 'fas fa-exclamation-circle', text: 'Issues', roles: ['employee', 'manager', 'admin'] },
      ]
    },
    {
      id: 'comm',
      title: 'OTHER',
      items: [
        { path: '/messages', icon: 'fas fa-comments', text: 'Messages', roles: ['employee', 'manager', 'admin'] },
        { path: '/notifications', icon: 'fas fa-bell', text: 'Notifications', roles: ['employee', 'manager', 'admin'] },
        { path: '/settings', icon: 'fas fa-cog', text: 'Settings', roles: ['employee', 'manager', 'admin'] },
        { path: '/admin', icon: 'fas fa-shield-alt', text: 'Admin', roles: ['admin'] },
      ]
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <div className="h-full flex flex-col bg-white shadow-xl border-r border-gray-200 w-full lg:w-auto">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 lg:p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className={`flex items-center space-x-2.5 ${collapsed ? 'lg:justify-center' : ''}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-briefcase text-white text-sm"></i>
          </div>
          
          <h2 className={`text-lg font-bold text-gray-900 ${collapsed ? 'lg:hidden' : 'block'}`}>
            WorkHub
          </h2>
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-gray-500 text-xs`}></i>
        </button>

        <button
          onClick={onClose}
          className="lg:hidden w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          aria-label="Close sidebar"
        >
          <i className="fas fa-times text-gray-500 text-sm"></i>
        </button>
      </div>

      {/* Navigation - NO SCROLL, Compact with Collapsible Sections */}
      <nav className="flex-1 px-2 py-2 overflow-hidden">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(item =>
            item.roles.includes(user?.role || 'employee')
          );

          if (visibleItems.length === 0) return null;

          const isExpanded = section.collapsible ? expandedSections[section.id] : true;

          return (
            <div key={section.id} className="mb-2">
              {/* Section Header */}
              {!collapsed && (
                <div
                  className={`flex items-center justify-between px-2 py-1 ${
                    section.collapsible ? 'cursor-pointer hover:bg-gray-50 rounded' : ''
                  }`}
                  onClick={() => section.collapsible && toggleSection(section.id)}
                >
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </p>
                  {section.collapsible && (
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-gray-400 text-[10px]`}></i>
                  )}
                </div>
              )}

              {/* Section Items - Show when expanded */}
              {isExpanded && (
                <div className="space-y-0.5 mt-1">
                  {visibleItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg transition-all duration-200 group relative ${
                        isActive(item.path)
                          ? 'bg-blue-600 text-white font-medium shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      } ${collapsed ? 'lg:justify-center lg:px-1.5' : ''}`}
                    >
                      <i 
                        className={`${item.icon} text-xs ${
                          isActive(item.path) 
                            ? 'text-white' 
                            : 'text-gray-400 group-hover:text-gray-600'
                        } ${collapsed ? 'lg:mx-auto' : ''}`}
                      ></i>
                      
                      <span className={`font-medium text-xs ${collapsed ? 'lg:hidden' : 'block'}`}>
                        {item.text}
                      </span>

                      {/* Tooltip when collapsed */}
                      {collapsed && (
                        <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                          {item.text}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-100 p-2.5 bg-gray-50">
        <div
          className={`flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200 ${
            collapsed ? 'lg:justify-center' : ''
          }`}
          onClick={onProfileClick}
        >
          <div className="relative flex-shrink-0">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-xs shadow-sm">
              {avatarInitial}
            </span>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 border-2 border-white rounded-full"></div>
          </div>
          
          <div className={`flex-1 min-w-0 ${collapsed ? 'lg:hidden' : 'block'}`}>
            <div className="text-xs font-semibold text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-[10px] text-gray-500 truncate capitalize">
              {user?.role}
            </div>
          </div>
        </div>

        <button
          onClick={onLogoutClick}
          className={`w-full mt-1.5 flex items-center space-x-2 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-transparent hover:border-red-100 font-medium text-xs ${
            collapsed ? 'lg:justify-center' : ''
          }`}
        >
          <i className="fas fa-sign-out-alt flex-shrink-0 text-xs"></i>
          <span className={collapsed ? 'lg:hidden' : 'block'}>Logout</span>
        </button>
      </div>
    </div>
  );
}
