import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Briefcase, 
  CheckSquare, 
  Settings,
  LogOut,
  Menu,
  X,
  Home
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  //const navigate = useNavigate();

  const sidebarLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { to: '/meetings', icon: Calendar, label: 'Meetings', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { to: '/projects', icon: Briefcase, label: 'Projects', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { to: '/teams', icon: Users, label: 'Teams', roles: ['ADMIN', 'MANAGER'] },
    { to: '/users', icon: Users, label: 'Users', roles: ['ADMIN'] },
    { to: '/settings', icon: Settings, label: 'Settings', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  ];

  const visibleLinks = sidebarLinks.filter(link => link.roles.includes(user?.role || ''));

  return (
    <>
      {/* Mobile toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed lg:static left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-700">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <Home size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Synergy</h1>
            <p className="text-xs text-gray-400">Project Manager</p>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <img 
              src={user?.avatarUrl || 'https://via.placeholder.com/40'} 
              alt={user?.name}
              className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-600/30 text-blue-300 rounded-full">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.label}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/20 border-l-4 border-blue-500 text-blue-400'
                      : 'text-gray-300 hover:bg-slate-700/50 border-l-4 border-transparent'
                  }`
                }
              >
                <Icon size={20} />
                <span className="font-medium">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="px-6 py-4 border-t border-slate-700">
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
