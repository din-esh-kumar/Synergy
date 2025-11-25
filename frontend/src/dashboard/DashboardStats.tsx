import React from 'react';
import { DashboardStats as StatsType } from '../types/dashboard.types';

interface Props {
  stats: StatsType;
}

const DashboardStats: React.FC<Props> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard title="Projects" value={stats.totalProjects} color="bg-blue-500" />
    <StatCard title="Tasks" value={stats.totalTasks} color="bg-green-500" />
    <StatCard title="Meetings" value={stats.totalMeetings} color="bg-purple-500" />
    <StatCard title="Issues" value={stats.totalIssues} color="bg-red-500" />
  </div>
);

const StatCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
    <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4`}>
      <span className="text-white text-2xl font-bold">{value}</span>
    </div>
    <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
  </div>
);

export default DashboardStats;
