// src/pages/Leaves/LeaveList.tsx
import React, { useEffect, useState } from 'react';
import { useLeaves } from '../../hooks/useLeaves';
import { useAuth } from '../../context/AuthContext';
import { LeaveStatus } from '../../types/leave.types';
import { CalendarDays as CalendarDaysIcon } from 'lucide-react';
import LeaveFormModal from './LeaveFormModal';

const LeaveList: React.FC = () => {
  const { user } = useAuth();
  const { leaves, fetchMyLeaves, loading } = useLeaves();

  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<{
    status: LeaveStatus | '';
    year: number;
  }>({
    status: '',
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    loadLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadLeaves = async () => {
    await fetchMyLeaves({
      status: filters.status || undefined,
      year: filters.year,
    });
  };

  const totalDays = leaves.reduce(
    (sum: number, leave: any) => sum + (leave.duration || 0),
    0
  );

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const mapStatusToLabel = (status: LeaveStatus) => {
  if (status === 'submitted') return 'PENDING';
  if (status === 'approved') return 'APPROVED';
  if (status === 'rejected') return 'REJECTED';
  if (status === 'draft') return 'DRAFT';
   return 'UNKNOWN';
};



  const mapStatusToClass = (status: LeaveStatus) => {
    if (status === 'approved') {
      return 'bg-green-100 text-green-800';
    }
    if (status === 'submitted') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (status === 'rejected') {
      return 'bg-red-100 text-red-800';
    }
    // draft or anything else
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CalendarDaysIcon className="w-8 h-8 text-indigo-600" />
            My Leaves
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage your leave applications
            <span className="ml-4 bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full font-medium">
              {totalDays} days taken
            </span>
          </p>
        </div>

        {!isManager && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl shadow-lg hover:bg-indigo-700 transition-all font-medium"
          >
            Apply Leave
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Filter Leaves
          </h3>
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as LeaveStatus | '',
                })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              {/* map to API values: submitted/approved/rejected/draft */}
              <option value="submitted">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={filters.year}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  year: Number(e.target.value),
                })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {Array.from({ length: 4 }).map((_, idx) => {
                const year = new Date().getFullYear() - idx;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Leave Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {leaves.map((leave: any) => {
                const statusLabel = mapStatusToLabel(leave.status as LeaveStatus);
                const statusClass = mapStatusToClass(leave.status as LeaveStatus);

                return (
                  <tr
                    key={leave._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {leave.startDate
                          ? new Date(leave.startDate).toLocaleDateString()
                          : ''}
                        {' - '}
                        {leave.endDate
                          ? new Date(leave.endDate).toLocaleDateString()
                          : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                        {/* prefer populated leaveTypeId.name if present */}
                        {leave.leaveTypeId?.name || leave.leaveType || 'Leave'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {leave.duration} day
                        {leave.duration === 1 ? '' : 's'}
                        {leave.halfDay && ' (Half day)'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="text-sm text-gray-900 dark:text-white max-w-xs truncate"
                        title={leave.reason}
                      >
                        {leave.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {leave.status === 'submitted' && (
                        <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {leaves.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No leave applications found for the selected filters.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading leaves...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <LeaveFormModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={async () => {
            setShowForm(false);
            await loadLeaves();
          }}
        />
      )}
    </div>
  );
};

export default LeaveList;
