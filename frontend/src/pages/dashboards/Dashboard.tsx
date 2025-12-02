// src/pages/dashboards/Dashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  CheckSquare,
  Calendar,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import dashboardService from '../../services/dashboard.service';
import meetingsService from '../../services/meetings.service';
import tasksService from '../../services/tasks.service';
import projectsService from '../../services/projects.service';
import { DashboardStats as StatsType, DashboardWidget } from '../../types/dashboard.types';
import { showToast } from '../../components/common/Toast';
import UpcomingMeetings from '../../components/widgets/UpcomingMeetings';
import RecentTasks from '../../components/widgets/RecentTasks';
import '../../styles/dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState<StatsType>({
    totalProjects: 0,
    totalTasks: 0,
    totalMeetings: 0,
    totalIssues: 0,
    todaysMeetings: 0,
    completedTasksThisWeek: 0,
    tasksByStatus: [],
    projectsByStatus: [],
    totalTeamMembers: 0,
    completedTasks: 0,
    ongoingProjects: 0,
  });

  const [meetings, setMeetings] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [meetingsData, tasksData, projectsData, statsData] =
        await Promise.all([
          meetingsService.getMeetings().catch(() => []),
          tasksService.getTasks().catch(() => []),
          projectsService.getProjects().catch(() => []),
          dashboardService.getDashboardStats().catch(() => null),
        ]);

      setMeetings(meetingsData);
      setTasks(tasksData);
      setProjects(projectsData);

      const baseStats: StatsType =
        statsData || {
          totalProjects: 0,
          totalTasks: 0,
          totalMeetings: 0,
          totalIssues: 0,
          todaysMeetings: 0,
          completedTasksThisWeek: 0,
          tasksByStatus: [],
          projectsByStatus: [],
          totalTeamMembers: 0,
          completedTasks: 0,
          ongoingProjects: 0,
        };

      const completedTasksCount = tasksData.filter(
        (t: any) => t.status === 'COMPLETED'
      ).length;

      const ongoingProjectsCount = projectsData.filter(
        (p: any) => p.status === 'ACTIVE'
      ).length;

      const calculatedStats: StatsType = {
        ...baseStats,
        totalMeetings: meetingsData.length,
        totalProjects: projectsData.length,
        totalTasks: tasksData.length,
        completedTasks: completedTasksCount,
        ongoingProjects: ongoingProjectsCount,
      };

      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showToast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30s polling

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const widgets: DashboardWidget[] = [
    {
      title: 'Total Meetings',
      value: stats.totalMeetings ?? 0,
      icon: 'calendar',
      color: 'blue',
      trend: 12,
    },
    {
      title: 'Total Projects',
      value: stats.totalProjects ?? 0,
      icon: 'project',
      color: 'purple',
      trend: 8,
    },
    {
      title: 'Total Tasks',
      value: stats.totalTasks ?? 0,
      icon: 'task',
      color: 'green',
      trend: 15,
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks ?? 0,
      icon: 'check',
      color: 'orange',
      trend: 5,
    },
  ];

  const getIconComponent = (icon: string) => {
    const iconProps = { size: 24, className: 'text-white' };
    switch (icon) {
      case 'calendar':
        return <Calendar {...iconProps} />;
      case 'project':
        return <BarChart3 {...iconProps} />;
      case 'task':
        return <CheckSquare {...iconProps} />;
      case 'check':
        return <TrendingUp {...iconProps} />;
      default:
        return <BarChart3 {...iconProps} />;
    }
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
      purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
      green: 'bg-gradient-to-br from-green-500 to-green-600',
      orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
      red: 'bg-gradient-to-br from-red-500 to-red-600',
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="p-6 text-slate-600 dark:text-slate-300">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, {user?.name}
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role !== 'EMPLOYEE' && (
            <>
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">
                <Plus size={16} />
                New Project
              </button>
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
                <Plus size={16} />
                New Task
              </button>
            </>
          )}
          {user?.role === 'EMPLOYEE' && (
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
              <Plus size={16} />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Stat widgets */}
      <div className="dashboard-grid">
        {widgets.map((widget, idx) => (
          <div
            key={idx}
            className={`dashboard-card ${getColorClass(
              widget.color
            )} text-white`}
          >
            <div className="dashboard-widget">
              <div>
                <p className="text-sm text-white/80">{widget.title}</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {widget.value}
                </p>
                {typeof widget.trend === 'number' && (
                  <p className="mt-1 text-xs text-white/70">
                    +{widget.trend}% this month
                  </p>
                )}
              </div>
              <div className="widget-icon bg-white/20">
                {getIconComponent(widget.icon)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: meetings + recent tasks */}
        <div className="xl:col-span-2 space-y-6">
          <div className="dashboard-card">
            <UpcomingMeetings meetings={meetings} />
          </div>

          <div className="dashboard-card">
            <RecentTasks tasks={tasks} />
          </div>
        </div>

        {/* Right column: quick stats + recent projects */}
        <div className="space-y-6">
          <div className="dashboard-card">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Quick Stats
            </h2>
            <div className="space-y-3 text-sm">
              {user?.role === 'ADMIN' && (
                <div className="stat-item">
                  <span className="text-slate-500 dark:text-slate-400">
                    Total Users
                  </span>
                  <span className="stat-value text-slate-900 dark:text-white">
                    {stats.totalTeamMembers ?? 0}
                  </span>
                </div>
              )}
              <div className="stat-item">
                <span className="text-slate-500 dark:text-slate-400">
                  Projects
                </span>
                <span className="stat-value text-slate-900 dark:text-white">
                  {stats.totalProjects ?? 0}
                </span>
              </div>
              <div className="stat-item">
                <span className="text-slate-500 dark:text-slate-400">
                  Tasks
                </span>
                <span className="stat-value text-slate-900 dark:text-white">
                  {stats.totalTasks ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 dark:text-slate-400">
                  Completed
                </span>
                <span className="stat-value text-slate-900 dark:text-white">
                  {stats.completedTasks ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Recent Projects
            </h2>
            {projects.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {projects.slice(0, 5).map((proj: any) => (
                  <li key={proj._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {proj.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {proj.status} • {proj.team?.length || 0} members
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No projects yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;









// // src/pages/dashboards/Dashboard.tsx
// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   BarChart3,
//   Users,
//   CheckSquare,
//   Calendar,
//   TrendingUp,
//   Plus,
// } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';
// import dashboardService from '../../services/dashboard.service';
// import meetingsService from '../../services/meetings.service';
// import tasksService from '../../services/tasks.service';
// import projectsService from '../../services/projects.service';
// import { DashboardStats as StatsType, DashboardWidget } from '../../types/dashboard.types';
// import { showToast } from '../../components/common/Toast';
// import UpcomingMeetings from '../../components/widgets/UpcomingMeetings';
// import RecentTasks from '../../components/widgets/RecentTasks';

// import '../../styles/dashboard.css';

// const Dashboard: React.FC = () => {
//   const { user } = useAuth();

//   const [stats, setStats] = useState<StatsType>({
//     totalProjects: 0,
//     totalTasks: 0,
//     totalMeetings: 0,
//     totalIssues: 0,
//     todaysMeetings: 0,
//     completedTasksThisWeek: 0,
//     tasksByStatus: [],
//     projectsByStatus: [],
//     totalTeamMembers: 0,
//     completedTasks: 0,
//     ongoingProjects: 0,
//   });

//   const [meetings, setMeetings] = useState<any[]>([]);
//   const [tasks, setTasks] = useState<any[]>([]);
//   const [projects, setProjects] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   const fetchDashboardData = useCallback(async () => {
//     try {
//       setLoading(true);

//       const [meetingsData, tasksData, projectsData, statsData] =
//         await Promise.all([
//           meetingsService.getMeetings().catch(() => []),
//           tasksService.getTasks().catch(() => []),
//           projectsService.getProjects().catch(() => []),
//           dashboardService.getDashboardStats().catch(() => null),
//         ]);

//       setMeetings(meetingsData);
//       setTasks(tasksData);
//       setProjects(projectsData);

//       const baseStats: StatsType =
//         statsData || {
//           totalProjects: 0,
//           totalTasks: 0,
//           totalMeetings: 0,
//           totalIssues: 0,
//           todaysMeetings: 0,
//           completedTasksThisWeek: 0,
//           tasksByStatus: [],
//           projectsByStatus: [],
//           totalTeamMembers: 0,
//           completedTasks: 0,
//           ongoingProjects: 0,
//         };

//       const completedTasksCount = tasksData.filter(
//         (t: any) => t.status === 'COMPLETED'
//       ).length;

//       const ongoingProjectsCount = projectsData.filter(
//         (p: any) => p.status === 'ACTIVE'
//       ).length;

//       const calculatedStats: StatsType = {
//         ...baseStats,
//         totalMeetings: meetingsData.length,
//         totalProjects: projectsData.length,
//         totalTasks: tasksData.length,
//         completedTasks: completedTasksCount,
//         ongoingProjects: ongoingProjectsCount,
//       };

//       setStats(calculatedStats);
//     } catch (error) {
//       console.error('Error fetching dashboard data:', error);
//       showToast.error('Failed to load dashboard');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchDashboardData();

//     const interval = setInterval(() => {
//       fetchDashboardData();
//     }, 30000); // 30s polling

//     return () => clearInterval(interval);
//   }, [fetchDashboardData]);

//   const widgets: DashboardWidget[] = [
//     {
//       title: 'Total Meetings',
//       value: stats.totalMeetings ?? 0,
//       icon: 'calendar',
//       color: 'blue',
//       trend: 12,
//     },
//     {
//       title: 'Total Projects',
//       value: stats.totalProjects ?? 0,
//       icon: 'project',
//       color: 'purple',
//       trend: 8,
//     },
//     {
//       title: 'Total Tasks',
//       value: stats.totalTasks ?? 0,
//       icon: 'task',
//       color: 'green',
//       trend: 15,
//     },
//     {
//       title: 'Completed Tasks',
//       value: stats.completedTasks ?? 0,
//       icon: 'check',
//       color: 'orange',
//       trend: 5,
//     },
//   ];

//   const getIconComponent = (icon: string) => {
//     const iconProps = { size: 24, className: 'text-white' };
//     switch (icon) {
//       case 'calendar':
//         return <Calendar {...iconProps} />;
//       case 'project':
//         return <BarChart3 {...iconProps} />;
//       case 'task':
//         return <CheckSquare {...iconProps} />;
//       case 'check':
//         return <TrendingUp {...iconProps} />;
//       default:
//         return <BarChart3 {...iconProps} />;
//     }
//   };

//   const getColorClass = (color: string) => {
//     const colorMap: { [key: string]: string } = {
//       blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
//       purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
//       green: 'bg-gradient-to-br from-green-500 to-green-600',
//       orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
//       red: 'bg-gradient-to-br from-red-500 to-red-600',
//     };
//     return colorMap[color] || colorMap.blue;
//   };

//   if (loading) {
//     return (
//       <div className="p-6 text-slate-600 dark:text-slate-300">
//         Loading dashboard...
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 md:p-6 space-y-6">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
//             Dashboard
//           </h1>
//           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
//             Welcome back, {user?.name}
//           </p>
//         </div>
//         <div className="flex gap-2">
//           {user?.role !== 'EMPLOYEE' && (
//             <>
//               <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">
//                 <Plus size={16} />
//                 New Project
//               </button>
//               <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
//                 <Plus size={16} />
//                 New Task
//               </button>
//             </>
//           )}
//           {user?.role === 'EMPLOYEE' && (
//             <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
//               <Plus size={16} />
//               New Task
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Stat widgets */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
//         {widgets.map((widget, idx) => (
//           <div
//             key={idx}
//             className={`${getColorClass(
//               widget.color
//             )} rounded-xl p-4 flex items-center justify-between shadow-sm`}
//           >
//             <div>
//               <p className="text-sm text-white/80">{widget.title}</p>
//               <p className="mt-2 text-2xl font-semibold text-white">
//                 {widget.value}
//               </p>
//               {typeof widget.trend === 'number' && (
//                 <p className="mt-1 text-xs text-white/70">
//                   +{widget.trend}% this month
//                 </p>
//               )}
//             </div>
//             <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
//               {getIconComponent(widget.icon)}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Main content grid */}
//       <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
//         {/* Left column: meetings + recent tasks */}
//         <div className="xl:col-span-2 space-y-6">
//           <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
//             <UpcomingMeetings meetings={meetings} />
//           </div>

//           <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
//             <RecentTasks tasks={tasks} />
//           </div>
//         </div>

//         {/* Right column: quick stats + recent projects */}
//         <div className="space-y-6">
//           <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
//             <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
//               Quick Stats
//             </h2>
//             <div className="space-y-3 text-sm">
//               {user?.role === 'ADMIN' && (
//                 <div className="flex items-center justify-between">
//                   <span className="text-slate-500 dark:text-slate-400">
//                     Total Users
//                   </span>
//                   <span className="font-semibold text-slate-900 dark:text-white">
//                     {stats.totalTeamMembers ?? 0}
//                   </span>
//                 </div>
//               )}
//               <div className="flex items-center justify-between">
//                 <span className="text-slate-500 dark:text-slate-400">
//                   Projects
//                 </span>
//                 <span className="font-semibold text-slate-900 dark:text-white">
//                   {stats.totalProjects ?? 0}
//                 </span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-slate-500 dark:text-slate-400">
//                   Tasks
//                 </span>
//                 <span className="font-semibold text-slate-900 dark:text-white">
//                   {stats.totalTasks ?? 0}
//                 </span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-slate-500 dark:text-slate-400">
//                   Completed
//                 </span>
//                 <span className="font-semibold text-slate-900 dark:text-white">
//                   {stats.completedTasks ?? 0}
//                 </span>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
//             <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
//               Recent Projects
//             </h2>
//             {projects.length > 0 ? (
//               <ul className="space-y-3 text-sm">
//                 {projects.slice(0, 5).map((proj: any) => (
//                   <li key={proj._id} className="flex items-center justify-between">
//                     <div>
//                       <p className="font-medium text-slate-900 dark:text-white">
//                         {proj.name}
//                       </p>
//                       <p className="text-xs text-slate-500 dark:text-slate-400">
//                         {proj.status} • {proj.team?.length || 0} members
//                       </p>
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className="text-sm text-slate-500 dark:text-slate-400">
//                 No projects yet
//               </p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
