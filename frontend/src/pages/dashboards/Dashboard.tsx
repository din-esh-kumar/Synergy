// src/pages/Dashboard/Dashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { useLeaves } from '../../hooks/useLeaves';
import { useExpenses } from '../../hooks/useExpenses';
import { useTimesheets } from '../../hooks/useTimesheets';
import {
  CalendarDays as CalendarDaysIcon,
  CreditCard as CreditCardIcon,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
} from 'lucide-react';
import { TimesheetStatus } from '../../types/timesheet.types'; // adjust path if needed

interface SafeStats {
  myTasksCount: number;
  openIssuesCount: number;
  upcomingMeetingsCount: number;
  activeProjectsCount: number;
  pendingApprovals: number;
}

const emptySafeStats: SafeStats = {
  myTasksCount: 0,
  openIssuesCount: 0,
  upcomingMeetingsCount: 0,
  activeProjectsCount: 0,
  pendingApprovals: 0,
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { dashboardData, stats, loading, error, refetch } = useDashboard();
  const { fetchLeaveBalance } = useLeaves();
  const { fetchMyExpenses } = useExpenses();
  const { fetchMyTimesheets } = useTimesheets();

  const [leaveBalance, setLeaveBalance] = useState<any[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState(0);
  const [pendingTimesheets, setPendingTimesheets] = useState(0);

  const loadDashboard = useCallback(async () => {
    try {
      await refetch();

      const balanceData = await fetchLeaveBalance();
      setLeaveBalance(balanceData?.data || []);

      const expensesData = await fetchMyExpenses({ status: 'PENDING' });
      setPendingExpenses(expensesData?.data?.length || 0);

      // Use lowercase value that matches TimesheetStatus type
      const timesheetsData = await fetchMyTimesheets({
        status: 'draft' as TimesheetStatus,
      });
      setPendingTimesheets(timesheetsData?.data?.length || 0);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  }, [refetch, fetchLeaveBalance, fetchMyExpenses, fetchMyTimesheets]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const safeStats: SafeStats = {
    myTasksCount:
      stats?.myTasksCount ??
      dashboardData?.stats?.myTasksCount ??
      emptySafeStats.myTasksCount,
    openIssuesCount:
      stats?.openIssuesCount ??
      dashboardData?.stats?.openIssuesCount ??
      emptySafeStats.openIssuesCount,
    upcomingMeetingsCount:
      stats?.upcomingMeetingsCount ??
      dashboardData?.stats?.upcomingMeetingsCount ??
      emptySafeStats.upcomingMeetingsCount,
    activeProjectsCount:
      stats?.activeProjectsCount ??
      dashboardData?.stats?.activeProjectsCount ??
      emptySafeStats.activeProjectsCount,
    pendingApprovals:
      stats?.pendingApprovals ??
      dashboardData?.stats?.pendingApprovals ??
      emptySafeStats.pendingApprovals,
  };

  if (loading && !dashboardData) {
    return (
      <div className="p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="p-6">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here&apos;s what&apos;s happening with your work today
        </p>
      </div>

      {/* SYNERGY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="My Tasks"
          value={safeStats.myTasksCount}
          icon="📋"
          color="bg-blue-500"
        />
        <StatCard
          title="Open Issues"
          value={safeStats.openIssuesCount}
          icon="⚠️"
          color="bg-yellow-500"
        />
        <StatCard
          title="Upcoming Meetings"
          value={safeStats.upcomingMeetingsCount}
          icon="📅"
          color="bg-purple-500"
        />
        <StatCard
          title="Active Projects"
          value={safeStats.activeProjectsCount}
          icon="📁"
          color="bg-green-500"
        />
      </div>

      {/* EMS SECTION */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Employee Management
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Leave Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <CalendarDaysIcon className="w-8 h-8 text-indigo-600" />
              <span className="text-sm font-medium text-gray-500">
                Leave Balance
              </span>
            </div>
            <div className="space-y-2">
              {leaveBalance.slice(0, 3).map((balance: any) => (
                <div
                  key={balance._id}
                  className="flex justify-between text-sm"
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {balance.leaveType?.name ||
                      balance.leaveType ||
                      'Leave'}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {balance.balance} days
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Expenses */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <CreditCardIcon className="w-8 h-8 text-green-600" />
              <span className="text-sm font-medium text-gray-500">
                Pending Expenses
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {pendingExpenses}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Awaiting approval
            </p>
          </div>

          {/* Draft Timesheets */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <ClockIcon className="w-8 h-8 text-orange-600" />
              <span className="text-sm font-medium text-gray-500">
                Draft Timesheets
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {pendingTimesheets}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Not yet submitted
            </p>
          </div>

          {/* Manager View - Approvals */}
          {isManager && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircleIcon className="w-8 h-8 text-blue-600" />
                <span className="text-sm font-medium text-gray-500">
                  Pending Approvals
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {safeStats.pendingApprovals}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Require your attention
              </p>
            </div>
          )}
        </div>
      </div>

      {/* REST OF DASHBOARD... */}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          {value}
        </p>
      </div>
      <div className={`${color} rounded-full p-3 text-2xl`}>{icon}</div>
    </div>
  </div>
);

export default Dashboard;
