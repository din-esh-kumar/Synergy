// src/pages/Timesheets/TimesheetList.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTimesheets } from '../../hooks/useTimesheets';
import TimesheetFormModal from '../../pages/Timesheets/TimesheetFormModal';
import {
  Clock as ClockIcon,
  Plus as PlusIcon,
  Filter as FilterIcon,
  Calendar as CalendarIcon,
  Briefcase as BriefcaseIcon,
  Trash2 as TrashIcon,
  Send as SendIcon,
} from 'lucide-react';
import { TimesheetStatus } from '../../types/timesheet.types';

const TimesheetList: React.FC = () => {
  const { user } = useAuth();
  const {
    timesheets,
    fetchMyTimesheets,
    loading,
    deleteTimesheet,
    submitTimesheet,
  } = useTimesheets();

  const [showForm, setShowForm] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filters, setFilters] = useState<{
    status: TimesheetStatus | '';
    projectId: string;
    startDate: string;
    endDate: string;
  }>({
    status: '',
    projectId: '',
    startDate: '',
    endDate: '',
  });

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const loadTimesheets = async () => {
    await fetchMyTimesheets({
      status: filters.status || undefined,
      projectId: filters.projectId || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    });
  };

  useEffect(() => {
    loadTimesheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const totalHours = timesheets.reduce(
    (sum: number, ts: any) => sum + (ts.hoursWorked || 0),
    0,
  );

  const formatStatusLabel = (status: TimesheetStatus) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getStatusClasses = (status: TimesheetStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const canEditOrDelete = (status: TimesheetStatus) =>
    status === 'draft' || status === 'rejected';

  const handleSubmitTimesheet = async (id: string) => {
    try {
      setSubmittingId(id);
      await submitTimesheet(id);
      await loadTimesheets();
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteTimesheet = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this timesheet?')) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteTimesheet(id);
      await loadTimesheets();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ClockIcon className="w-8 h-8 text-blue-600" />
            Timesheets
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your work hours and submit for approval
            <span className="ml-4 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
              {totalHours.toFixed(1)} total hours
            </span>
          </p>
        </div>

        {!isManager && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedTimesheet(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg hover:bg-blue-700 transition-all font-medium"
            >
              <PlusIcon className="w-4 h-4" />
              Log Hours
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FilterIcon className="w-4 h-4" />
            Filter Timesheets
          </h3>
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as TimesheetStatus | '',
                })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Optional: project filter could go here */}

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
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
              {timesheets.map((timesheet: any) => {
                const status: TimesheetStatus = timesheet.status;
                const editable = canEditOrDelete(status);
                const isSubmitting = submittingId === timesheet._id;
                const isDeleting = deletingId === timesheet._id;

                return (
                  <tr
                    key={timesheet._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {timesheet.date
                          ? new Date(timesheet.date).toLocaleDateString()
                          : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <BriefcaseIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {timesheet.projectId?.name || 'General'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                        {timesheet.hoursWorked}h
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="text-sm text-gray-900 dark:text-white max-w-xs truncate"
                        title={timesheet.taskDescription || timesheet.description}
                      >
                        {timesheet.taskDescription || timesheet.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClasses(
                          status,
                        )}`}
                      >
                        {formatStatusLabel(status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!isManager && editable && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setSelectedTimesheet(timesheet);
                              setShowForm(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            disabled={isSubmitting || isDeleting}
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleSubmitTimesheet(timesheet._id)}
                            className="inline-flex items-center gap-1 text-green-600 hover:text-green-900 disabled:opacity-50"
                            disabled={isSubmitting || isDeleting}
                          >
                            <SendIcon className="w-4 h-4" />
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDeleteTimesheet(timesheet._id)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 disabled:opacity-50"
                            disabled={isSubmitting || isDeleting}
                          >
                            <TrashIcon className="w-4 h-4" />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {timesheets.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No timesheets found for the selected filters.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading timesheets...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <TimesheetFormModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={async () => {
            setShowForm(false);
            await loadTimesheets();
          }}
          editTimesheet={selectedTimesheet || undefined}
        />
      )}
    </div>
  );
};

export default TimesheetList;
