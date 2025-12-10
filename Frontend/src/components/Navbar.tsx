// src/components/Navbar.tsx - WorkHub Navbar
import { useAuthStore } from '../store/authStore';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuthStore();

  const getCurrentDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date());
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left Section - Menu & Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <i className="fas fa-bars text-lg"></i>
        </button>
        
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-briefcase text-white text-sm"></i>
          </div>
          <span className="font-bold text-gray-900 text-lg">WorkHub</span>
        </div>
      </div>

      {/* Right Section - User Info */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
          <i className="fas fa-calendar-alt"></i>
          <span>{getCurrentDate()}</span>
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
            {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
