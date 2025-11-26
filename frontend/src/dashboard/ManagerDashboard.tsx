import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import dashboardService, { DashboardStats } from '../services/dashboard.service';
import meetingsService from '../services/meetings.service';
import { Meeting } from '../types/meetings.types';
import { Briefcase, CheckSquare, Calendar, Users, TrendingUp } from 'lucide-react';
import UpcomingMeetings from '../meetings/UpcomingMeetings';

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm font-medium mb-2">{label}</p>
        <p className="text-3xl font-bold text-white">{value ?? 0}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [statsRes, meetingsRes] = await Promise.all([
        dashboardService.getManagerStats(),
        meetingsService.getMeetings(),
      ]);
      setStats(statsRes);
      setMeetings(meetingsRes);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Manager Dashboard</h1>
        <p className="text-gray-400">Welcome back, <span className="text-blue-400 font-semibold">{user?.name}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Briefcase} label="Active Projects" value={stats.activeProjects} color="bg-blue-600" />
        <StatCard icon={Users} label="Team Members" value={stats.teamMembers} color="bg-indigo-600" />
        <StatCard icon={CheckSquare} label="Pending Tasks" value={stats.pendingTasks} color="bg-red-600" />
        <StatCard icon={TrendingUp} label="Team Productivity" value={`${stats.teamProductivity || 0}%`} color="bg-green-600" />
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar size={24} className="text-blue-400" />
          Team Meetings
        </h2>
        <UpcomingMeetings meetings={meetings.slice(0, 5)} />
      </div>
    </div>
  );
};

export default ManagerDashboard;
