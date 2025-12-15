// src/components/admin/ExportPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Download,
  FileText,
  Calendar,
  Clock,
  DollarSign,
} from 'lucide-react';
import api from '../../services/api';
import adminService from '../../services/admin.service';
import projectsService from '../../services/projects.service';

type DataType = 'timesheets' | 'expenses' | 'leaves' | 'all';
type ExportFormat = 'csv' | 'excel' | 'pdf';

interface ExportOption {
  type: DataType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface UserOption {
  id: string;
  name: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
type ExpenseStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED';
type LeaveStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

const ExportPage: React.FC = () => {
  const [dataType, setDataType] = useState<DataType>('timesheets');
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: new Date(new Date().getFullYear(), 0, 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [status, setStatus] = useState<
    TimesheetStatus | ExpenseStatus | LeaveStatus | ''
  >('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(false);

  const exportOptions: ExportOption[] = [
    {
      type: 'timesheets',
      label: 'Timesheets',
      description: 'Export timesheet entries and hours',
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
    },
    {
      type: 'expenses',
      label: 'Expenses',
      description: 'Export expense claims and reports',
      icon: DollarSign,
      color: 'from-orange-500 to-orange-600',
    },
    {
      type: 'leaves',
      label: 'Leaves',
      description: 'Export leave applications and balances',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
    },
    {
      type: 'all',
      label: 'All Modules',
      description: 'Export timesheets, expenses and leaves together',
      icon: FileText,
      color: 'from-indigo-500 to-indigo-600',
    },
  ];

  // Load users and projects
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [usersRes, projectsRes] = await Promise.all([
          adminService.getAllUsers(),
          projectsService.getProjects(),
        ]);

        setUsers(
          (usersRes || []).map((u: any) => ({
            id: u._id || u.id,
            name:
              `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
          })),
        );

        setProjects(
          (projectsRes || []).map((p: any) => ({
            id: p._id || p.id,
            name: p.name,
          })),
        );
      } catch (err) {
        console.error('Failed to load filter data', err);
      }
    };

    loadFilters();
  }, []);

  const buildParams = () => ({
    userId: selectedUserId || undefined,
    projectId:
      dataType === 'timesheets' || dataType === 'all'
        ? selectedProjectId || undefined
        : undefined,
    status: status || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const downloadBlob = (blob: Blob, prefix: string) => {
    const urlObject = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = urlObject;

    const ext = format === 'excel' ? 'xlsx' : format;
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `${prefix}_export_${today}.${ext}`);

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(urlObject);
  };

  const exportSingle = async (type: 'timesheets' | 'expenses' | 'leaves') => {
    const urlMap: Record<'timesheets' | 'expenses' | 'leaves', string> = {
      timesheets: '/export/timesheets',
      expenses: '/export/expenses',
      leaves: '/export/leaves',
    };

    const response = await api.get(urlMap[type], {
      params: buildParams(),
      responseType: 'blob',
    });

    downloadBlob(response.data, type);
  };

  const handleExport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Please select a valid date range.');
      return;
    }
    if (dateRange.startDate > dateRange.endDate) {
      alert('Start date cannot be after end date.');
      return;
    }

    try {
      setLoading(true);

      if (dataType === 'all') {
        await exportSingle('timesheets');
        await exportSingle('expenses');
        await exportSingle('leaves');
      } else {
        await exportSingle(dataType);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions: string[] =
    dataType === 'expenses'
      ? ['DRAFT', 'PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED']
      : ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'];

  const effectiveTypeLabel =
    dataType === 'all'
      ? 'Timesheets, Expenses & Leaves'
      : exportOptions.find((o) => o.type === dataType)?.label ?? '';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Download className="w-8 h-8 text-blue-600" />
          Export Data
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Export filtered timesheets, expenses and leaves for reporting and
          analysis.
        </p>
      </div>

      {/* Data type selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = dataType === option.type;

          return (
            <button
              key={option.type}
              onClick={() => setDataType(option.type)}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg bg-gradient-to-br ${option.color} text-white`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {option.label}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {option.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Export configuration */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 space-y-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Export Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side: format + filters */}
          <div className="space-y-4">
            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Export Format
              </label>
              <div className="space-y-2">
                {(['csv', 'excel', 'pdf'] as ExportFormat[]).map((f) => (
                  <label
                    key={f}
                    className="flex items-center p-3 border rounded-lg cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <input
                      type="radio"
                      name="format"
                      value={f}
                      checked={format === f}
                      onChange={(e) =>
                        setFormat(e.target.value as ExportFormat)
                      }
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-slate-900 dark:text-white uppercase">
                      {f}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* User filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                User (optional)
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Project (optional)
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={dataType === 'expenses' || dataType === 'leaves'}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status (optional)
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as
                      | TimesheetStatus
                      | ExpenseStatus
                      | LeaveStatus
                      | '',
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All statuses</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right side: date range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Date Range
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Export Summary
          </h3>
          <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
            <p>
              <span className="font-medium">Data:</span> {effectiveTypeLabel}
            </p>
            <p>
              <span className="font-medium">Format:</span> {format.toUpperCase()}
            </p>
            <p>
              <span className="font-medium">Period:</span>{' '}
              {new Date(dateRange.startDate).toLocaleDateString()} -{' '}
              {new Date(dateRange.endDate).toLocaleDateString()}
            </p>
            <p>
              <span className="font-medium">User:</span>{' '}
              {selectedUserId
                ? users.find((u) => u.id === selectedUserId)?.name ??
                  'Selected user'
                : 'All users'}
            </p>
            {(dataType === 'timesheets' || dataType === 'all') && (
              <p>
                <span className="font-medium">Project:</span>{' '}
                {selectedProjectId
                  ? projects.find((p) => p.id === selectedProjectId)?.name ??
                    'Selected project'
                  : 'All projects'}
              </p>
            )}
            {status && (
              <p>
                <span className="font-medium">Status:</span> {status}
              </p>
            )}
          </div>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500 font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Generating Export...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Export Data
            </>
          )}
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <p className="font-medium text-slate-900 dark:text-white mb-1">
              Export Information
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Exports are generated based on selected filters and date range.
              </li>
              <li>Large exports may take a few moments to process.</li>
              <li>
                Excel format is best for analysis; CSV for importing into other
                tools.
              </li>
              <li>PDF format is ideal for printing and archiving.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
