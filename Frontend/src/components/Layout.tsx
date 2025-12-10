// src/components/Layout.tsx - WorkHub Layout
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ProfileModal from './ProfileModal';
import ConfirmationModal from './ConfirmationModal';

export default function Layout() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogoutConfirm = () => {
    logout();
    navigate('/login');
    setShowLogoutModal(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setSidebarOpen(false);
  };

  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <Sidebar
        collapsed={!sidebarOpen && sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        onClose={closeSidebar}
        onProfileClick={() => {
          setShowProfileModal(true);
          closeSidebar();
        }}
        onLogoutClick={handleLogoutClick}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={toggleSidebar} />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Logout Confirmation"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        confirmColor="red"
      />
    </div>
  );
}
