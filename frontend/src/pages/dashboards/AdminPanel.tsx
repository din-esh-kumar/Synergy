// src/pages/EMS/Admin/AdminPanel.tsx - COMPLETE ADMIN DASHBOARD
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLeaves } from '../../../hooks/useLeaves';
import { useExpenses } from '../../../hooks/useExpenses';
import { useTimesheets } from '../../../hooks/useTimesheets';
import {
  UsersIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  ClockIcon,
  FileTextIcon,
  BarChart3Icon
} from 'lucide-react';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { fetchLeaveStatistics, fetchAllLeaves } = useLeaves();
  const { fetchAllExpenses, fetchExpenseStats } = useExpenses();
  const { fetchAllTimesheets } = useTimesheets();

  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingLeaves: 0,
    pendingExpenses: 0,
    pendingTimesheets: 0,
    totalAmount: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    setLoading(true);
    try {
      const [leaveStats, expenseStats, timesheets, expenses] = await Promise.all([
        fetchLeaveStatistics(),
        fetchExpenseStats(),
        fetchAllTimesheets({ status: 'SUBMITTED' }),
        fetchAllExpenses({ status: 'PENDING' })
      ]);

      setStats({
        totalUsers: user?.role === 'ADMIN' ? 25 : 10, // Mock for demo
        pendingLeaves: leaveStats.data?.byStatus?.find((s: any) => s._id === 'PENDING')?.count || 0,
        pendingExpenses: expenses.data?.length || 0,
        pendingTimesheets: timesheets.data?.length || 0,
        totalAmount: expenseStats.data?.byStatus?.reduce((sum: number, stat: any) => sum + stat.totalAmount, 0) || 0
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage employee requests and system settings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={UsersIcon}
          color="bg-indigo-500"
        />
        <StatCard
          title="Pending Leaves"
          value={stats.pendingLeaves}
          icon={CalendarDaysIcon}
          color="bg-orange-500"
          href="/leaves"
        />
        <StatCard
          title="Pending Expenses"
          value={stats.pendingExpenses}
          icon={CreditCardIcon}
          color="bg-yellow-500"
          href="/expenses"
        />
        <StatCard
          title="Pending Timesheets"
          value={stats.pendingTimesheets}
          icon={ClockIcon}
          color="bg-blue-500"
          href="/timesheets"
        />
        <StatCard
          title="Total Expenses"
          value={`₹${stats.totalAmount.toLocaleString()}`}
          icon={BarChart3Icon}
          color="bg-green-500"
          href="/export"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ActionCard
          title="Manage Leaves"
          description="View and approve leave applications"
          icon={CalendarDaysIcon}
          href="/approvals?tab=leaves"
          color="bg-gradient-to-r from-indigo-500 to-purple-600"
        />
        <ActionCard
          title="Review Expenses"
          description="Approve or reject expense claims"
          icon={CreditCardIcon}
          href="/approvals?tab=expenses"
          color="bg-gradient-to-r from-yellow-500 to-orange-500"
        />
        <ActionCard
          title="Timesheet Approvals"
          description="Review submitted timesheets"
          icon={ClockIcon}
          href="/approvals?tab=timesheets"
          color="bg-gradient-to-r from-blue-500 to-cyan-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          <ActivityItem
            title="John Doe applied for 3 days sick leave"
            time="2 hours ago"
            type="leave"
            status="pending"
          />
          <ActivityItem
            title="Jane Smith submitted ₹2500 travel expense"
            time="5 hours ago"
            type="expense"
            status="pending"
          />
          <ActivityItem
            title="Mike Johnson submitted weekly timesheet"
            time="1 day ago"
            type="timesheet"
            status="approved"
          />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  href?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, href }) => (
  <a href={href} className="group">
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow p-6 hover:shadow-xl transition-all group-hover:-translate-y-1 ${href ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</p>
          <p className={`text-2xl font-bold ${color === 'bg-green-500' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
            {value}
          </p>
        </div>
        <div className={`${color} rounded-lg p-3`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  </a>
);

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon: Icon, href, color }) => (
  <a href={href} className="group">
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all group-hover:-translate-y-2 cursor-pointer ${color} text-white`}>
      <div className="flex items-start space-x-4">
        <div className="p-3 rounded-lg bg-white/20">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-1">{title}</h3>
          <p className="text-sm opacity-90">{description}</p>
        </div>
      </div>
    </div>
  </a>
);

interface ActivityItemProps {
  title: string;
  time: string;
  type: string;
  status: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ title, time, type, status }) => (
  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <div className={`w-2 h-2 rounded-full ${
      status === 'pending' ? 'bg-yellow-500' :
      status === 'approved' ? 'bg-green-500' : 'bg-red-500'
    }`}></div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{time}</p>
    </div>
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
      type === 'leave' ? 'bg-orange-100 text-orange-800' :
      type === 'expense' ? 'bg-yellow-100 text-yellow-800' :
      'bg-blue-100 text-blue-800'
    }`}>
      {type}
    </span>
  </div>
);

export default AdminPanel;
