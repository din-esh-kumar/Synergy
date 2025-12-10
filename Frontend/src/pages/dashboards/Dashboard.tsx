// Dashboard.tsx - EMS + Synergy Integration
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useExpenseStore } from '../../store/expenseStore';
import { useLeaveStore } from '../../store/leaveStore';
import { useAdminStore } from '../../store/adminStore';
import { useApprovalStore } from '../../store/approvalStore';
import { useProjectStore } from '../../store/projectStore';
// ADDED: Synergy imports
import meetingsService from '../../services/meetings.service';
import tasksService from '../../services/tasks.service';
import toast from 'react-hot-toast';

interface DashboardStats {
  pendingTimesheets: number;
  pendingExpenses: number;
  teamPendingApprovals: number;
  totalUsers?: number;
  totalProjects?: number;
  activeLeaves?: number;
  pendingLeaves?: number;
  pendingApprovals?: number;
  // ADDED: Synergy stats
  totalMeetings?: number;
  pendingTasks?: number;
}

// Enhanced StatCard with better zero state handling
const StatCard = ({
  title,
  value,
  subtitle,
  color = 'blue',
  icon,
  loading = false,
  onClick,
  showZeroAsEmpty = false,
  emptyMessage = "No items"
}: {
  title: string;
  value: number | string;
  subtitle: string;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'indigo';
  icon: string;
  loading?: boolean;
  onClick?: () => void;
  showZeroAsEmpty?: boolean;
  emptyMessage?: string;
}) => {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50 hover:bg-blue-100 cursor-pointer',
    green: 'border-green-500 bg-green-50 hover:bg-green-100 cursor-pointer',
    purple: 'border-purple-500 bg-purple-50 hover:bg-purple-100 cursor-pointer',
    red: 'border-red-500 bg-red-50 hover:bg-red-100 cursor-pointer',
    yellow: 'border-yellow-500 bg-yellow-50 hover:bg-yellow-100 cursor-pointer',
    indigo: 'border-indigo-500 bg-indigo-50 hover:bg-indigo-100 cursor-pointer'
  };

  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    indigo: 'text-indigo-600'
  };

  const displayValue = loading
    ? '...'
    : (showZeroAsEmpty && (value === 0 || value === '0'))
      ? emptyMessage
      : value;

  const isZeroState = showZeroAsEmpty && (value === 0 || value === '0') && !loading;
  const valueClass = isZeroState
    ? "text-lg font-semibold text-gray-500"
    : "text-3xl font-bold text-gray-800";

  return (
    <div
      className={`p-6 rounded-lg border-l-4 ${colorClasses[color]} transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer' : ''
        } ${isZeroState ? 'opacity-75' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={valueClass}>
            {displayValue}
          </p>
          <p className={`text-xs mt-2 ${isZeroState ? 'text-gray-400' : 'text-gray-500'
            }`}>
            {subtitle}
          </p>
        </div>
        <div className={`text-2xl ${iconColors[color]} ${isZeroState ? 'opacity-50' : ''
          }`}>
          <i className={icon}></i>
        </div>
      </div>

      {isZeroState && (
        <div className="mt-2 flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          <span className="text-xs text-green-600">All caught up</span>
        </div>
      )}
    </div>
  );
};

const QuickAction = ({
  title,
  description,
  icon,
  onClick,
  color = 'blue',
  disabled = false,
  badge,
  badgeColor = 'gray'
}: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'indigo';
  disabled?: boolean;
  badge?: string | number;
  badgeColor?: 'red' | 'green' | 'yellow' | 'blue' | 'gray';
}) => {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
  };

  const badgeColorClasses = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    gray: 'bg-gray-500'
  };

  const disabledClasses = 'bg-gray-400 cursor-not-allowed';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-4 rounded-lg text-white text-left transition-all duration-200 relative ${disabled ? disabledClasses : colorClasses[color]
        } hover:shadow-md`}
    >
      {badge && (
        <span className={`absolute -top-2 -right-2 ${badgeColorClasses[badgeColor]} text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold`}>
          {badge}
        </span>
      )}
      <div className="text-2xl mb-2">
        <i className={icon}></i>
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </button>
  );
};

// ADDED: Upcoming Meetings Component
const UpcomingMeetingsCard = ({ meetings }: { meetings: any[] }) => {
  const upcomingMeetings = meetings
    .filter(m => new Date(m.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  if (upcomingMeetings.length === 0) {
    return (
      <div className="text-center py-8">
        <i className="fas fa-calendar-times text-gray-300 text-4xl mb-3"></i>
        <p className="text-gray-500 text-sm">No upcoming meetings scheduled</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {upcomingMeetings.map((meeting, idx) => (
        <div key={idx} className="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <i className="fas fa-video text-blue-600"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{meeting.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">
                <i className="far fa-calendar mr-1"></i>
                {new Date(meeting.startTime).toLocaleDateString()}
              </span>
              <span className="text-xs text-gray-500">
                <i className="far fa-clock mr-1"></i>
                {new Date(meeting.startTime).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            {meeting.location && (
              <p className="text-xs text-gray-400 mt-1 truncate">
                <i className="fas fa-map-marker-alt mr-1"></i>
                {meeting.location}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const EmptyStateCard = ({
  title,
  message,
  icon,
  action,
  color = 'gray'
}: {
  title: string;
  message: string;
  icon: string;
  action?: { label: string; onClick: () => void };
  color?: 'blue' | 'green' | 'purple' | 'gray';
}) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50',
    gray: 'border-gray-200 bg-gray-50'
  };

  const iconColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    gray: 'text-gray-400'
  };

  return (
    <div className={`p-6 rounded-lg border-2 border-dashed ${colorClasses[color]} text-center`}>
      <div className={`text-3xl mb-3 ${iconColors[color]}`}>
        <i className={icon}></i>
      </div>
      <h3 className="font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-3">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {action.label} →
        </button>
      )}
    </div>
  );
};

const DashboardLoadingSkeleton = () => (
  <div className="h-full flex flex-col">
    <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
    </div>
    <div className="flex-1 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-6 rounded-lg border-l-4 border-gray-200 bg-gray-50 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { timesheets, fetchTimesheets, loading: timesheetLoading } = useTimesheetStore();
  const { expenses, fetchExpenses, loading: expenseLoading } = useExpenseStore();
  const {
    leaveBalances,
    fetchLeaveBalances,
    leaves,
    fetchLeaves,
    getTeamPendingLeaves,
    getPendingLeaves,
    loading: leaveLoading
  } = useLeaveStore();
  const {
    users,
    projects,
    fetchAllUsers,
    fetchAllProjects,
    loading: adminLoading
  } = useAdminStore();
  const {
    pendingTimesheets,
    pendingExpenses,
    pendingLeaves,
    fetchAllPending,
    loading: approvalLoading
  } = useApprovalStore();
  const { projects: allProjects, fetchProjects } = useProjectStore();

  // ADDED: Synergy state
  const [meetings, setMeetings] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const [stats, setStats] = useState<DashboardStats>({
    pendingTimesheets: 0,
    pendingExpenses: 0,
    teamPendingApprovals: 0,
    totalUsers: 0,
    totalProjects: 0,
    activeLeaves: 0,
    pendingLeaves: 0,
    pendingApprovals: 0,
    // ADDED: Synergy stats
    totalMeetings: 0,
    pendingTasks: 0,
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Memoized data fetching function
  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all required data in parallel
      const fetchPromises = [
        fetchTimesheets(),
        fetchExpenses(),
        fetchLeaveBalances(),
        fetchLeaves(),
        // ADDED: Synergy data fetching
        meetingsService.getMeetings().then(setMeetings).catch(() => []),
        tasksService.getTasks().then(setTasks).catch(() => []),
      ];

      // Add role-specific fetches
      if (user.role === 'admin') {
        fetchPromises.push(fetchAllUsers(), fetchAllProjects(), fetchAllPending());
      } else if (user.role === 'manager') {
        fetchPromises.push(fetchAllPending());
      }

      // Fetch projects for all users
      fetchPromises.push(fetchProjects());

      await Promise.allSettled(fetchPromises);

      setLastUpdated(new Date());
    } catch (error) {
      toast.error('Failed to load some dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user, fetchTimesheets, fetchExpenses, fetchLeaveBalances, fetchLeaves,
    fetchAllUsers, fetchAllProjects, fetchAllPending, fetchProjects]);

  // Calculate stats whenever relevant data changes
  useEffect(() => {
    if (!user) return;

    const pendingTimesheetsCount = timesheets.filter(ts =>
      ts.status === 'submitted' || ts.status === 'draft'
    ).length;

    const pendingExpensesCount = expenses.filter(expense =>
      expense.status === 'submitted' || expense.status === 'draft'
    ).length;

    const teamPendingApprovalsCount = user.role === 'manager' ?
      getTeamPendingLeaves(user.id).length : 0;

    const activeLeavesCount = leaves.filter(leave =>
      leave.status === 'approved' &&
      new Date(leave.startDate) <= new Date() &&
      new Date(leave.endDate) >= new Date()
    ).length;

    const pendingLeavesCount = getPendingLeaves ? getPendingLeaves().length : 0;

    const totalPendingApprovals =
      (user.role === 'admin' || user.role === 'manager')
        ? pendingTimesheets.length + pendingExpenses.length + pendingLeaves.length
        : 0;

    // ADDED: Synergy stats calculation
    const pendingTasksCount = tasks.filter(t => 
      t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
    ).length;

    setStats({
      pendingTimesheets: pendingTimesheetsCount || 0,
      pendingExpenses: pendingExpensesCount || 0,
      teamPendingApprovals: teamPendingApprovalsCount || 0,
      totalUsers: users.length || 0,
      totalProjects: allProjects.filter(p => p.isActive).length || 0,
      activeLeaves: activeLeavesCount || 0,
      pendingLeaves: pendingLeavesCount || 0,
      pendingApprovals: totalPendingApprovals || 0,
      // ADDED: Synergy stats
      totalMeetings: meetings.length || 0,
      pendingTasks: pendingTasksCount || 0,
    });
  }, [
    user, timesheets, expenses, leaveBalances, leaves, users, allProjects,
    pendingTimesheets, pendingExpenses, pendingLeaves, getTeamPendingLeaves, getPendingLeaves,
    // ADDED: Synergy dependencies
    meetings, tasks
  ]);

  // Initial load and refresh every 2 minutes
  useEffect(() => {
    loadDashboardData();

    const interval = setInterval(() => {
      loadDashboardData();
    }, 120000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Manual refresh function
  const handleRefresh = () => {
    loadDashboardData();
    toast.success('Dashboard refreshed');
  };

  // Navigation handlers
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const handleStatClick = (type: string) => {
    switch (type) {
      case 'timesheets':
        navigateTo('/timesheets');
        break;
      case 'expenses':
        navigateTo('/expenses');
        break;
      case 'leaves':
        navigateTo('/leaves');
        break;
      case 'approvals':
        navigateTo('/approvals');
        break;
      case 'admin':
        navigateTo('/admin');
        break;
      // ADDED: Synergy navigation
      case 'meetings':
        navigateTo('/meetings');
        break;
      case 'tasks':
        navigateTo('/tasks');
        break;
      default:
        break;
    }
  };

  const isLoading = loading || timesheetLoading || expenseLoading || leaveLoading ||
    (user?.role === 'admin' && adminLoading) || approvalLoading;

  if (isLoading && loading) {
    return <DashboardLoadingSkeleton />;
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Please log in to view dashboard</h2>
        </div>
      </div>
    );
  }

  const hasPendingItems = stats.pendingTimesheets > 0 || stats.pendingExpenses > 0 || (stats.pendingLeaves || 0) > 0;
  const hasApprovals = (stats.pendingApprovals || 0) > 0 || stats.teamPendingApprovals > 0;
  const hasActiveLeaves = (stats.activeLeaves || 0) > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-gray-800">
                Welcome back, {user.firstName}! 👋
              </h1>
              <button
                onClick={handleRefresh}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Refresh dashboard"
              >
                <i className="fa-solid fa-rotate text-sm"></i>
              </button>
            </div>
            <p className="text-gray-600 text-sm">
              Role: <span className="font-medium capitalize">{user.role}</span>
              {lastUpdated && (
                <span className="ml-2 text-gray-500">
                  • Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {/* Existing EMS Stats */}
          <StatCard
            title="Pending Timesheets"
            value={stats.pendingTimesheets}
            subtitle="Awaiting submission or approval"
            color="blue"
            icon="fa-solid fa-clock"
            loading={isLoading}
            onClick={() => handleStatClick('timesheets')}
            showZeroAsEmpty={true}
            emptyMessage="All done!"
          />

          <StatCard
            title="Pending Expenses"
            value={stats.pendingExpenses}
            subtitle="Awaiting submission or approval"
            color="green"
            icon="fa-solid fa-receipt"
            loading={isLoading}
            onClick={() => handleStatClick('expenses')}
            showZeroAsEmpty={true}
            emptyMessage="All caught up"
          />

          {/* ADDED: Total Meetings */}
          <StatCard
            title="Total Meetings"
            value={stats.totalMeetings || 0}
            subtitle="Scheduled meetings"
            color="purple"
            icon="fa-solid fa-video"
            loading={isLoading}
            onClick={() => handleStatClick('meetings')}
            showZeroAsEmpty={false}
          />

          {/* ADDED: Pending Tasks */}
          <StatCard
            title="Pending Tasks"
            value={stats.pendingTasks || 0}
            subtitle="Active & pending tasks"
            color="yellow"
            icon="fa-solid fa-tasks"
            loading={isLoading}
            onClick={() => handleStatClick('tasks')}
            showZeroAsEmpty={false}
          />

          {/* Manager-specific stats */}
          {user.role === 'manager' && (
            <StatCard
              title="Team Approvals"
              value={stats.teamPendingApprovals}
              subtitle="Pending your review"
              color="yellow"
              icon="fa-solid fa-user-check"
              loading={isLoading}
              onClick={() => handleStatClick('approvals')}
              showZeroAsEmpty={true}
              emptyMessage="No pending items"
            />
          )}

          {/* Admin-specific stats */}
          {user.role === 'admin' && (
            <>
              <StatCard
                title="Total Users"
                value={stats.totalUsers || 0}
                subtitle="Active users in system"
                color="indigo"
                icon="fa-solid fa-users"
                loading={isLoading}
                onClick={() => handleStatClick('admin')}
                showZeroAsEmpty={false}
              />

              <StatCard
                title="Active Projects"
                value={stats.totalProjects || 0}
                subtitle="Currently active projects"
                color="blue"
                icon="fa-solid fa-folder"
                loading={isLoading}
                onClick={() => handleStatClick('admin')}
                showZeroAsEmpty={false}
              />
            </>
          )}

          {/* Combined pending approvals for managers/admins */}
          {(user.role === 'admin' || user.role === 'manager') && (
            <StatCard
              title="Total Pending"
              value={stats.pendingApprovals || 0}
              subtitle="All pending approvals"
              color="red"
              icon="fa-solid fa-clipboard-check"
              loading={isLoading}
              onClick={() => handleStatClick('approvals')}
              showZeroAsEmpty={true}
              emptyMessage="All clear!"
            />
          )}

          {hasActiveLeaves && (
            <StatCard
              title="On Leave Today"
              value={stats.activeLeaves || 0}
              subtitle="Team members on leave"
              color="purple"
              icon="fa-solid fa-calendar-day"
              loading={isLoading}
              showZeroAsEmpty={false}
            />
          )}

          {!hasPendingItems && (user.role === 'employee') && (
            <EmptyStateCard
              title="All Caught Up!"
              message="You have no pending timesheets, expenses, or leaves. Great job!"
              icon="fa-solid fa-check-circle"
              color="green"
              action={{
                label: "Create new item",
                onClick: () => navigateTo('/timesheets')
              }}
            />
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
            {hasApprovals && (
              <span className="text-sm text-red-600 font-medium">
                {stats.pendingApprovals || 0} items need your attention
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction
              title="Submit Timesheet"
              description="Log your working hours"
              icon="fa-solid fa-clock"
              onClick={() => navigateTo('/timesheets')}
              color="blue"
              badge={stats.pendingTimesheets > 0 ? stats.pendingTimesheets : undefined}
              badgeColor="blue"
            />

            <QuickAction
              title="Add Expense"
              description="Submit new expense claim"
              icon="fa-solid fa-receipt"
              onClick={() => navigateTo('/expenses')}
              color="green"
              badge={stats.pendingExpenses > 0 ? stats.pendingExpenses : undefined}
              badgeColor="green"
            />

            <QuickAction
              title="Apply Leave"
              description="Request time off"
              icon="fa-solid fa-umbrella-beach"
              onClick={() => navigateTo('/leaves')}
              color="purple"
            />

            {(user.role === 'manager' || user.role === 'admin') && (
              <QuickAction
                title="Review Approvals"
                description="Check pending requests"
                icon="fa-solid fa-user-check"
                onClick={() => navigateTo('/approvals')}
                color="yellow"
                disabled={!hasApprovals}
                badge={hasApprovals ? (stats.pendingApprovals || 0) : undefined}
                badgeColor="red"
              />
            )}
          </div>
        </div>

        {/* ADDED: Upcoming Meetings Widget */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-video text-blue-600"></i>
              Upcoming Meetings
            </h2>
            <button
              onClick={() => navigateTo('/meetings')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </button>
          </div>
          <UpcomingMeetingsCard meetings={meetings} />
        </div>

        {/* Role-specific notifications */}
        {user.role === 'manager' && (
          <div className={`rounded-lg p-4 mb-4 ${stats.teamPendingApprovals > 0
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-green-50 border border-green-200'
            }`}>
            <div className="flex items-start">
              <div className={`text-lg mr-3 ${stats.teamPendingApprovals > 0 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                <i className={`fa-solid ${stats.teamPendingApprovals > 0 ? 'fa-exclamation-circle' : 'fa-check-circle'
                  }`}></i>
              </div>
              <div>
                <h3 className={`text-md font-semibold mb-1 ${stats.teamPendingApprovals > 0 ? 'text-yellow-800' : 'text-green-800'
                  }`}>
                  Manager Dashboard
                </h3>
                <p className={`text-sm ${stats.teamPendingApprovals > 0 ? 'text-yellow-700' : 'text-green-700'
                  }`}>
                  {stats.teamPendingApprovals > 0
                    ? `You have ${stats.teamPendingApprovals} pending approvals from your team members. Please review them promptly.`
                    : 'All team approvals are up to date. Great job!'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {user.role === 'admin' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-indigo-600 text-lg mr-3">
                <i className="fa-solid fa-shield-alt"></i>
              </div>
              <div>
                <h3 className="text-md font-semibold text-indigo-800 mb-1">
                  Admin Dashboard
                </h3>
                <p className="text-indigo-700 text-sm">
                  Manage {stats.totalUsers} users and {stats.totalProjects} active projects.
                  {hasApprovals && ` You have ${stats.pendingApprovals || 0} items awaiting approval.`}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => navigateTo('/admin')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition text-sm font-medium"
                  >
                    Go to Admin Panel
                  </button>
                  {hasApprovals && (
                    <button
                      onClick={() => navigateTo('/approvals')}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition text-sm font-medium"
                    >
                      Review Approvals
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
