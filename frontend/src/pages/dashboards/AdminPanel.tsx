// src/pages/dashboards/AdminPanel.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Download,
  Users,
  Tag,
  Calendar,
  Scale,
  FileText,
  LucideIcon,
} from 'lucide-react';

import UserManagementTable from '../../components/admin/UserManagementTable';
import LeaveTypesManagementTable from '../../components/admin/LeaveTypesManagementTable';
import HolidaysManagementTable from '../../components/admin/HolidaysManagementTable';
import LeaveBalancesManagementTable from '../../components/admin/LeaveBalancesManagementTable';
import LeaveApplicationsOverview from '../../components/admin/LeaveApplicationsOverview';
import ExportPage from '../../components/admin/ExportPage';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface Tab {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

const TABS: Tab[] = [
  {
    key: 'users',
    label: 'Users',
    icon: Users,
    description:
      'Add, delete, activate/deactivate, and promote users by changing roles.',
  },
  {
    key: 'leave-types',
    label: 'Leave Types',
    icon: Tag,
    description: 'Configure leave types used across the organization.',
  },
  {
    key: 'holidays',
    label: 'Holidays',
    icon: Calendar,
    description: 'Create and manage company holidays.',
  },
  {
    key: 'leave-balances',
    label: 'Leave Balances',
    icon: Scale,
    description: 'View and adjust employee leave balances.',
  },
  {
    key: 'leave-applications',
    label: 'Leave Applications',
    icon: FileText,
    description: 'Full overview and CRUD on leave applications.',
  },
  {
    key: 'export',
    label: 'Export',
    icon: Download,
    description: 'Export timesheets, leaves, and expenses data.',
  },
];

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = () => {
      if (!user) {
        setIsLoading(true);
        return;
      }

      if (user.role !== 'ADMIN') {
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
        return <LeaveTypesManagementTable />;
      case 2:
        return <HolidaysManagementTable />;
      case 3:
        return <LeaveBalancesManagementTable />;
      case 4:
        return <LeaveApplicationsOverview />;
      case 5:
        return <ExportPage />;
      default:
        return <UserManagementTable />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Admin Panel
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {TABS[activeTab].description}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab(5)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Export</span>
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex overflow-x-auto scrollbar-hide" aria-label="Tabs">
              <div className="flex min-w-full sm:min-w-0 px-2">
                {TABS.map((tab, index) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === index;

                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(index)}
                      className={`group relative flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                        isActive
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-white dark:hover:border-slate-600'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-transform ${
                          isActive ? 'scale-110' : 'group-hover:scale-105'
                        }`}
                      />
                      <span>{tab.label}</span>

                      {isActive && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <div className="animate-fadeIn">{renderTabContent()}</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;























































// // src/pages/dashboards/AdminPanel.tsx
// import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Shield,
//   Download,
//   Users,
//   Tag,
//   Calendar,
//   Scale,
//   FileText,
//   CheckSquare,
//   LucideIcon,
// } from 'lucide-react';

// import UserManagementTable from '../../components/admin/UserManagementTable';
// // ProjectManagementTable import removed
// import LeaveTypesManagementTable from '../../components/admin/LeaveTypesManagementTable';
// import HolidaysManagementTable from '../../components/admin/HolidaysManagementTable';
// import LeaveBalancesManagementTable from '../../components/admin/LeaveBalancesManagementTable';
// import LeaveApplicationsOverview from '../../components/admin/LeaveApplicationsOverview';
// import Approvals from '../../pages/dashboards/Approvals';
// import ExportPage from '../../components/admin/ExportPage';
// import toast from 'react-hot-toast';
// import { useAuth } from '../../context/AuthContext';

// interface Tab {
//   key: string;
//   label: string;
//   icon: LucideIcon;
//   description: string;
// }

// const TABS: Tab[] = [
//   {
//     key: 'users',
//     label: 'Users',
//     icon: Users,
//     description:
//       'Add, delete, activate/deactivate, and promote users by changing roles.',
//   },
//   // Projects tab removed
//   {
//     key: 'leave-types',
//     label: 'Leave Types',
//     icon: Tag,
//     description: 'Configure leave types used across the organization.',
//   },
//   {
//     key: 'holidays',
//     label: 'Holidays',
//     icon: Calendar,
//     description: 'Create and manage company holidays.',
//   },
//   {
//     key: 'leave-balances',
//     label: 'Leave Balances',
//     icon: Scale,
//     description: 'View and adjust employee leave balances.',
//   },
//   {
//     key: 'leave-applications',
//     label: 'Leave Applications',
//     icon: FileText,
//     description: 'Full overview and CRUD on leave applications.',
//   },
//   {
//     key: 'approvals',
//     label: 'Approvals',
//     icon: CheckSquare,
//     description:
//       'Approve or reject leaves, timesheets, and expenses from one place.',
//   },
//   {
//     key: 'export',
//     label: 'Export',
//     icon: Download,
//     description: 'Export timesheets, leaves, and expenses data.',
//   },
// ];

// const AdminPanel: React.FC = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);

//   // Check admin access
//   useEffect(() => {
//     const checkAccess = () => {
//       if (!user) {
//         setIsLoading(true);
//         return;
//       }

//       if (user.role !== 'ADMIN') {
//         toast.error('Access denied. Admin privileges required.');
//         navigate('/');
//         return;
//       }

//       setIsLoading(false);
//     };

//     checkAccess();
//   }, [user, navigate]);

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 0:
//         // Users
//         return <UserManagementTable />;
//       case 1:
//         // Leave types CRUD
//         return <LeaveTypesManagementTable />;
//       case 2:
//         // Holidays CRUD
//         return <HolidaysManagementTable />;
//       case 3:
//         // Leave balances CRUD
//         return <LeaveBalancesManagementTable />;
//       case 4:
//         // Leave applications overview with admin actions
//         return <LeaveApplicationsOverview />;
//       case 5:
//         // Central approvals for leaves, timesheets, expenses
//         return <Approvals />;
//       case 6:
//         // Data export
//         return <ExportPage />;
//       default:
//         return <UserManagementTable />;
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
//           <p className="text-slate-600 dark:text-slate-400 text-lg">
//             Checking permissions...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
//       <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6">
//         {/* Header */}
//         <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//             <div className="flex items-center gap-4">
//               <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
//                 <Shield className="w-7 h-7 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
//                   Admin Panel
//                 </h1>
//                 <p className="text-slate-600 dark:text-slate-400 mt-1">
//                   {TABS[activeTab].description}
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={() => setActiveTab(6)}
//               className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
//             >
//               <Download className="w-5 h-5" />
//               <span className="font-medium">Export</span>
//             </button>
//           </div>
//         </div>

//         {/* Tabs Navigation */}
//         <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
//           <div className="border-b border-slate-200 dark:border-slate-700">
//             <nav className="flex overflow-x-auto scrollbar-hide" aria-label="Tabs">
//               <div className="flex min-w-full sm:min-w-0 px-2">
//                 {TABS.map((tab, index) => {
//                   const Icon = tab.icon;
//                   const isActive = activeTab === index;

//                   return (
//                     <button
//                       key={tab.key}
//                       onClick={() => setActiveTab(index)}
//                       className={`group relative flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
//                         isActive
//                           ? 'border-blue-600 text-blue-600 dark:text-blue-400'
//                           : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-white dark:hover:border-slate-600'
//                       }`}
//                     >
//                       <Icon
//                         className={`w-5 h-5 transition-transform ${
//                           isActive ? 'scale-110' : 'group-hover:scale-105'
//                         }`}
//                       />
//                       <span>{tab.label}</span>

//                       {isActive && (
//                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />
//                       )}
//                     </button>
//                   );
//                 })}
//               </div>
//             </nav>
//           </div>

//           {/* Tab Content */}
//           <div className="p-6">
//             <div className="animate-fadeIn">{renderTabContent()}</div>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//             transform: translateY(10px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         .animate-fadeIn {
//           animation: fadeIn 0.3s ease-out;
//         }

//         .scrollbar-hide::-webkit-scrollbar {
//           display: none;
//         }

//         .scrollbar-hide {
//           -ms-overflow-style: none;
//           scrollbar-width: none;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default AdminPanel;
