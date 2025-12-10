import React, { useEffect, useState } from 'react';
import { useExportStore } from '../../store/exportStore';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';

export default function ExportPage() {
  const { user } = useAuthStore();
  const { exportTimesheets, exportExpenses, exportLeaves, loading, error, clearError } =
    useExportStore();

  const [filters, setFilters] = useState({
    employeeId: '',
    projectId: '',
    startDate: '',
    endDate: '',
    status: '',
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    if (!user || user.role !== 'admin') window.location.href = '/';
  }, [user]);

  // ✅ Fetch employees and projects
  useEffect(() => {
    async function fetchLists() {
      setLoadingEmployees(true);
      setLoadingProjects(true);
      try {
        const [usersRes, projectsRes] = await Promise.all([
          apiClient.get('/api/user'),
          apiClient.get('/api/projects?isActive=true'),
        ]);
        setEmployees(usersRes.data.data || []);
        setProjects(projectsRes.data.data || []);
      } catch (err) {
        // console.error('Failed to load lists', err);
        toast.error('Failed to load employees or projects');
      } finally {
        setLoadingEmployees(false);
        setLoadingProjects(false);
      }
    }
    fetchLists();
  }, []);

  const onFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const onExportClick = async (type: 'timesheets' | 'expenses' | 'leaves') => {
    try {
      if (type === 'timesheets') await exportTimesheets(filters);
      else if (type === 'expenses') await exportExpenses(filters);
      else if (type === 'leaves') await exportLeaves(filters);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!`);
    } catch (err: any) {
      // console.error(`Export ${type} failed:`, err);
      toast.error(`Failed to export ${type}. Please try again.`);
    }
  };

  const clearFilters = () => {
    setFilters({
      employeeId: '',
      projectId: '',
      startDate: '',
      endDate: '',
      status: '',
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Export Data</h2>
            <p className="text-gray-600 text-sm">Export timesheets, expenses, and leave data</p>
          </div>
          <button
            onClick={clearFilters}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Content Area - No scrolling */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Filters Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex-shrink-0">
            <h3 className="text-md font-medium mb-3 text-gray-800">Export Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Employee Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee
                </label>
                {loadingEmployees ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading employees...</span>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
                    No employees found
                  </div>
                ) : (
                  <select
                    name="employeeId"
                    value={filters.employeeId}
                    onChange={onFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Project Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                {loadingProjects ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading projects...</span>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
                    No active projects found
                  </div>
                ) : (
                  <select
                    name="projectId"
                    value={filters.projectId}
                    onChange={onFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Projects</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={onFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={onFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={onFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Export Options Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1">
            <h3 className="text-md font-medium mb-4 text-gray-800">Export Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {/* Timesheets Export */}
              <button
                onClick={() => onExportClick('timesheets')}
                disabled={loading}
                className={`p-4 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center text-center ${
                  loading
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                    : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:shadow-sm'
                }`}
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-3">
                  <i className="fas fa-clock text-white text-lg"></i>
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">Export Timesheets</h4>
                <p className="text-xs text-gray-600">Time tracking data with applied filters</p>
              </button>

              {/* Expenses Export */}
              <button
                onClick={() => onExportClick('expenses')}
                disabled={loading}
                className={`p-4 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center text-center ${
                  loading
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                    : 'bg-white border-gray-300 hover:border-green-500 hover:bg-green-50 hover:shadow-sm'
                }`}
              >
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-3">
                  <i className="fas fa-receipt text-white text-lg"></i>
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">Export Expenses</h4>
                <p className="text-xs text-gray-600">Expense claims data with applied filters</p>
              </button>

              {/* Leaves Export */}
              <button
                onClick={() => onExportClick('leaves')}
                disabled={loading}
                className={`p-4 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center text-center ${
                  loading
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                    : 'bg-white border-gray-300 hover:border-purple-500 hover:bg-purple-50 hover:shadow-sm'
                }`}
              >
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-3">
                  <i className="fas fa-umbrella-beach text-white text-lg"></i>
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">Export Leaves</h4>
                <p className="text-xs text-gray-600">Leave applications data with applied filters</p>
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-700 font-medium text-sm">Exporting data, please wait...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}