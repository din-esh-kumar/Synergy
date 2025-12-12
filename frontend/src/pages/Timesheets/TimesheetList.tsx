// src/pages/EMS/Timesheets/TimesheetList.tsx - FULL TIMESHEET PAGE
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTimesheets } from '../../../hooks/useTimesheets';
import TimesheetFormModal from '../../../components/EMS/Timesheets/TimesheetFormModal';
import {
  ClockIcon,
  PlusIcon,
  FilterIcon,
  CalendarIcon,
  BriefcaseIcon
} from 'lucide-react';

const TimesheetList: React.FC = () => {
  const { user } = useAuth();
  const { 
    timesheets, 
    fetchMyTimesheets, 
    loading 
  } = useTimesheets();

  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ 
    status: '', 
    projectId: '', 
    startDate: '',
    endDate: ''
  });
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);

  useEffect(() => {
    fetchMyTimesheets(filters);
  }, [filters]);

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const totalHours = timesheets.reduce((sum, ts: any) => sum + (ts.hoursWorked || 0), 0);

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
              onClick={() => setShowForm(true)}
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
          <h3 className="font-semibold text-gray-900 dark:text-white">Filter Timesheets</h3>
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
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
              {timesheets.map((timesheet: any) => (
                <tr key={timesheet._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(timesheet.date).toLocaleDateString()}
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
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate" title={timesheet.taskDescription}>
                      {timesheet.taskDescription}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      timesheet.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      timesheet.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' :
                      timesheet.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {timesheet.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {timesheet.status === 'DRAFT' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedTimesheet(timesheet)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button className="text-green-600 hover:text-green-900">Submit</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <TimesheetFormModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchMyTimesheets(filters);
          }}
          editTimesheet={selectedTimesheet || null}
        />
      )}
    </div>
  );
};

export default TimesheetList;
