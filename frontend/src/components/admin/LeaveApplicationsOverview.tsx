// src/components/admin/LeaveApplicationsOverview.tsx
import React, { useEffect, useState } from 'react';
import {
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Users,
} from 'lucide-react';
import api from '../../services/api';

interface ByTypeItem {
  leaveTypeId: string;
  name: string;
  color?: string;
  count: number;
}

interface TopUserItem {
  userId: string;
  name: string;
  email: string;
  count: number;
}

interface LeaveOverviewStats {
  year: number;
  stats: {
    totalApplications: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  byType: ByTypeItem[];
  topUsers: TopUserItem[];
  recentApplications: RecentApplication[];
}

interface RecentApplication {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  leaveTypeId: {
    _id: string;
    name: string;
    color?: string;
  };
  startDate: string;
  endDate: string;
  status: string;
  reason: string;
}

const LeaveApplicationsOverview: React.FC = () => {
  const [overview, setOverview] = useState<LeaveOverviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get<{
        success: boolean;
        data: LeaveOverviewStats;
      }>(`/leaves/admin/applications-overview`, {
        params: { year: selectedYear },
      });

      setOverview(res.data?.data || null);
    } catch (error) {
      console.error('Error fetching leave overview:', error);
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'submitted':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const totalApplications = overview?.stats.totalApplications ?? 0;
  const pending = overview?.stats.pending ?? 0;
  const approved = overview?.stats.approved ?? 0;
  const rejected = overview?.stats.rejected ?? 0;
  const byLeaveType = overview?.byType ?? [];
  const topUsers = overview?.topUsers ?? [];
  const recentApplications = overview?.recentApplications ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Leave Applications Overview
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Monitor and analyze leave application trends
          </p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        >
          {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Applications */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                Total Applications
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {totalApplications}
              </h3>
            </div>
            <Calendar className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending</p>
              <h3 className="text-3xl font-bold mt-2">{pending}</h3>
            </div>
            <Clock className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        {/* Approved */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Approved</p>
              <h3 className="text-3xl font-bold mt-2">{approved}</h3>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Rejected</p>
              <h3 className="text-3xl font-bold mt-2">{rejected}</h3>
            </div>
            <XCircle className="w-12 h-12 text-red-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Type Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            By Leave Type
          </h3>
          {byLeaveType.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No data available for the selected year.
            </p>
          ) : (
            <div className="space-y-3">
              {byLeaveType.map((item) => (
                <div
                  key={item.leaveTypeId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {item.color && (
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Users */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Top Users
          </h3>
          {topUsers.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No user data available for the selected year.
            </p>
          ) : (
            <div className="space-y-3">
              {topUsers.map((item) => (
                <div
                  key={item.userId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.email}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Recent Applications
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {recentApplications.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No recent applications.
                  </td>
                </tr>
              ) : (
                recentApplications.map((application) => (
                  <tr
                    key={application._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {application.userId.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {application.userId.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {application.leaveTypeId.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                application.leaveTypeId.color,
                            }}
                          />
                        )}
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {application.leaveTypeId.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {new Date(
                          application.startDate,
                        ).toLocaleDateString()}{' '}
                        -{' '}
                        {new Date(
                          application.endDate,
                        ).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          application.status,
                        )}`}
                      >
                        {application.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {application.reason}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveApplicationsOverview;
