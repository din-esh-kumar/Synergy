// src/pages/EMS/Export/ExportPage.tsx
import React, { useState } from 'react';
import { DownloadIcon, FileTextIcon, CalendarIcon, Loader2Icon } from 'lucide-react';
import { exportService } from '../../../services/export.service';

type ExportType = 'LEAVES' | 'EXPENSES' | 'TIMESHEETS';

const ExportPage: React.FC = () => {
  const [exportType, setExportType] = useState<ExportType>('LEAVES');
  const [format, setFormat] = useState<'CSV' | 'EXCEL'>('CSV');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      alert('Please select date range');
      return;
    }
    setLoading(true);
    try {
      await exportService.exportData({
        type: exportType,
        format,
        startDate,
        endDate,
      });
    } catch (err) {
      console.error('Export failed', err);
      alert('Export failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FileTextIcon className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Export EMS Data
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Download leaves, expenses and timesheets for reporting or backup.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-6">
        {/* What to export */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Data set
          </h2>
          <div className="flex flex-wrap gap-3">
            {(['LEAVES', 'EXPENSES', 'TIMESHEETS'] as ExportType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setExportType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  exportType === type
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                }`}
              >
                {type === 'LEAVES' && 'Leave applications'}
                {type === 'EXPENSES' && 'Expenses'}
                {type === 'TIMESHEETS' && 'Timesheets'}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Date range
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <div className="relative">
                <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <div className="relative">
                <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Format */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Format
          </h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormat('CSV')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                format === 'CSV'
                  ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 border-indigo-500'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
              }`}
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => setFormat('EXCEL')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                format === 'EXCEL'
                  ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 border-indigo-500'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
              }`}
            >
              Excel
            </button>
          </div>
        </div>

        {/* Export button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleExport}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? (
              <>
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                Preparing file...
              </>
            ) : (
              <>
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Note: exported data respects current user permissions. Admins can see all
          employees; managers see their team; employees see only their own records.
        </p>
      </div>
    </div>
  );
};

export default ExportPage;
