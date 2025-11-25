import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import DashboardStats from './DashboardStats';
import UpcomingMeetings from './UpcomingMeetings';
import RecentTasks from './RecentTasks';

const DashboardHome: React.FC = () => {
  const { dashboardData, loading, error } = useDashboard();

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!dashboardData) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <DashboardStats stats={dashboardData.stats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <UpcomingMeetings meetings={dashboardData.upcomingMeetings} />
        <RecentTasks tasks={dashboardData.recentTasks} />
      </div>
    </div>
  );
};

export default DashboardHome;
