import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import dashboardService, { DashboardStats } from '../services/dashboard.service';
import meetingsService from '../services/meetings.service';
import { Meeting } from '../types/meetings.types';
import userService, { User } from '../services/user.service';
import { Users, Briefcase, CheckSquare, Calendar, TrendingUp, Activity } from 'lucide-react';
import UpcomingMeetings from '../meetings/UpcomingMeetings';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color, trend }: any) => (
  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm font-medium mb-2">{label}</p>
        <p className="text-3xl font-bold text-white">{value ?? 0}</p>
        {trend !== undefined && (
          <p className={`text-xs mt-2 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : (trend < 0 ? '↓' : '•')} {Math.abs(trend)}% from last week
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({});
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [statsRes, meetingsRes, usersRes, activityRes] = await Promise.all([
        dashboardService.getAdminStats(),
        meetingsService.getMeetings(),
        userService.getAllUsers(),
        dashboardService.getRecentActivity(5),
      ]);
      setStats(statsRes);
      setMeetings(meetingsRes);
      setUsers(usersRes);
      setActivity(activityRes);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">
          Welcome back, <span className="text-blue-400 font-semibold">{user?.name}</span>. 
          Here's your organization's overview.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers ?? users.length} color="bg-blue-600" trend={5.2} />
        <StatCard icon={Briefcase} label="Active Projects" value={stats.activeProjects} color="bg-indigo-600" trend={-1.5} />
        <StatCard icon={CheckSquare} label="Pending Tasks" value={stats.pendingTasks} color="bg-red-600" trend={3.1} />
        <StatCard icon={Calendar} label="Upcoming Meetings" value={stats.upcomingMeetings} color="bg-green-600" trend={-2} />
        <StatCard icon={TrendingUp} label="Total Teams" value={stats.totalTeams} color="bg-purple-600" trend={0} />
      </div>

      {/* User Overview */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users size={24} className="text-blue-400" />
          Users Overview
          <span className="ml-2 px-2 py-1 text-xs bg-blue-700/30 text-blue-200 rounded-full font-mono">
            {users.length ?? 0} users
          </span>
        </h2>
        {users.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto py-2">
            {users.map((u) => (
              <div key={u._id} className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 min-w-[180px] flex flex-col items-center text-center shadow hover:border-blue-700 hover:-translate-y-1 transition-all duration-200">
                <img
                  src={u.avatar ?? 'https://via.placeholder.com/40'}
                  alt={u.name}
                  className="w-10 h-10 rounded-full mb-2 border-2 border-blue-400"
                />
                <span className="font-semibold text-white truncate">{u.name}</span>
                <span className="text-xs text-gray-400 truncate mb-1">{u.email}</span>
                <span className="px-2 py-0.5 text-xs bg-blue-600/30 text-blue-300 rounded-full">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-6">No users found</div>
        )}
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Add User', icon: Users, path: '/users' },
          { label: 'Create Project', icon: Briefcase, path: '/projects' },
          { label: 'New Task', icon: CheckSquare, path: '/tasks' },
          { label: 'Schedule Meeting', icon: Calendar, path: '/meetings' },
          { label: 'View Teams', icon: Users, path: '/teams' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 rounded-lg transition-all duration-200"
            >
              <Icon size={24} />
              <span className="text-xs font-medium text-center">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upcoming Meetings */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar size={24} className="text-blue-400" />
            Upcoming Meetings
          </h2>
          {meetings.length > 0 ? (
            <UpcomingMeetings meetings={meetings.slice(0, 5)} />
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Calendar size={48} className="mx-auto mb-2 opacity-30" />
              <p>No upcoming meetings</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity size={24} className="text-green-400" />
            Recent Activity
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activity.map((event, i) => (
              <div key={i} className="text-sm border-l-2 border-blue-500 pl-3 py-2">
                <p className="font-medium text-white">{event.user}</p>
                <p className="text-gray-400 text-xs">{event.action}</p>
                <p className="text-gray-500 text-xs mt-1">{event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}</p>
              </div>
            ))}
            {activity.length === 0 && <p className="text-center text-gray-400 py-4">No recent activity</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
