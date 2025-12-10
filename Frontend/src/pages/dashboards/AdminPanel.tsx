// AdminPanel.tsx (Enhanced with grid layout)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import UserManagementTable from '../../components/admin/UserManagementTable';
import ProjectManagementTable from '../../components/admin/ProjectManagementTable';
import LeaveTypesManagementTable from '../../components/admin/LeaveTypesManagementTable';
import HolidaysManagementTable from '../../components/admin/HolidaysManagementTable';
import LeaveBalancesManagementTable from '../../components/admin/LeaveBalancesManagementTable';
import LeaveApplicationsOverview from '../../components/admin/LeaveApplicationsOverview';
import ExportPage from '../../components/admin/ExportPage';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'users', label: 'Users', icon: 'fas fa-users', description: 'Manage system users' },
  { key: 'projects', label: 'Projects', icon: 'fas fa-folder', description: 'Manage projects' },
  { key: 'leave-types', label: 'Leave Types', icon: 'fas fa-tags', description: 'Configure leave types' },
  { key: 'holidays', label: 'Holidays', icon: 'fas fa-calendar', description: 'Manage holidays' },
  { key: 'leave-balances', label: 'Leave Balances', icon: 'fas fa-scale-balanced', description: 'View leave balances' },
  { key: 'leave-applications', label: 'Leave Applications', icon: 'fas fa-file-lines', description: 'Review leave requests' },
  { key: 'export', label: 'Export', icon: 'fas fa-download', description: 'Export data' }
];

export default function AdminPanel() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { error, clearError } = useAdminStore();

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    const checkAccess = () => {
      if (!user) {
        setIsLoading(true);
        return;
      }
      
      if (user.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }
      
      setIsLoading(false);
    };

    checkAccess();
  }, [user, navigate]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <UserManagementTable />;
      case 1:
        return <ProjectManagementTable />;
      case 2:
        return <LeaveTypesManagementTable />;
      case 3:
        return <HolidaysManagementTable />;
      case 4:
        return <LeaveBalancesManagementTable />;
      case 5:
        return <LeaveApplicationsOverview />;
      case 6:
        return <ExportPage />;
      default:
        return <UserManagementTable />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className=" bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
              <i className="fas fa-shield-alt text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 text-sm">{TABS[activeTab].description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <i className={`${TABS[activeTab].icon} mr-1`}></i>
              {TABS[activeTab].label}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex-shrink-2 bg-white border-b border-gray-200 px-4 sm:px-6 py-2 shadow-sm">
        <div className="relative">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide pb-2 -mb-2">
            {TABS.map((tab, index) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(index)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap border min-w-max ${
                  activeTab === index
                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <i className={`${tab.icon} ${activeTab === index ? 'text-blue-600' : 'text-gray-400'} text-sm`}></i>
                <span>{tab.label}</span>
                {activeTab === index && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content - Enhanced for mobile grid */}
      <div className="flex-1 p-4 sm:p-6 overflow-hidden">
        <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}