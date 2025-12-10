// // src/components/Header.tsx
// import React from 'react';
// import { useAuthStore } from '../store/authStore';
// import { Menu, Search, Bell, Settings, LogOut } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

// interface HeaderProps {
//   onMenuClick?: () => void;
// }

// const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
//   const { user, logout } = useAuthStore();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   const handleProfileClick = () => {
//     navigate('/settings');
//   };

//   const userInitial = user?.firstName?.charAt(0)?.toUpperCase() || 'U';

//   return (
//     <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
//       <div className="flex items-center justify-between px-6 py-4">
//         {/* Left Section - Mobile Menu & Search */}
//         <div className="flex items-center gap-4">
//           <button
//             onClick={onMenuClick}
//             className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
//           >
//             <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
//           </button>

//           {/* Search Bar */}
//           <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2 flex-1 max-w-xs">
//             <Search className="w-4 h-4 text-slate-400" />
//             <input
//               type="text"
//               placeholder="Search..."
//               className="bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none flex-1"
//             />
//           </div>
//         </div>

//         {/* Right Section - Notifications & User */}
//         <div className="flex items-center gap-4">
//           {/* Notifications */}
//           <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
//             <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
//             <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
//           </button>

//           {/* Settings */}
//           <button
//             onClick={handleProfileClick}
//             className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
//           >
//             <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
//           </button>

//           {/* Divider */}
//           <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700"></div>

//           {/* User Info */}
//           <div className="hidden sm:flex items-center gap-3">
//             <div className="text-right">
//               <p className="text-sm font-medium text-slate-900 dark:text-white">
//                 {user?.firstName} {user?.lastName}
//               </p>
//               <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
//                 {user?.role}
//               </p>
//             </div>
//             <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white">
//               {userInitial}
//             </div>
//           </div>

//           {/* Logout - Mobile */}
//           <button
//             onClick={handleLogout}
//             className="sm:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
//           >
//             <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-400" />
//           </button>

//           {/* Logout - Desktop */}
//           <button
//             onClick={handleLogout}
//             className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
//           >
//             <LogOut className="w-4 h-4" />
//             <span>Logout</span>
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;