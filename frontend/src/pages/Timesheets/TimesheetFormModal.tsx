// src/components/Timesheets/TimesheetFormModal.tsx
import React, { useState, useEffect } from 'react';
import { useTimesheets } from '../../hooks/useTimesheets';
import { useTeams } from '../../hooks/useTeams';
import {
  X,
  Check as CheckIcon,
  Briefcase as BriefcaseIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
} from 'lucide-react';
import { TimesheetFormData } from '../../types/timesheet.types';

interface TimesheetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTimesheet?: TimesheetFormData & {
    _id: string;
    projectId?: { _id: string; name: string };
  };
}

type TimesheetFormErrors = Partial<
  Record<'projectId' | 'date' | 'hoursWorked' | 'taskDescription', string>
>;

const TimesheetFormModal: React.FC<TimesheetFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editTimesheet,
}) => {
  const { createTimesheet, updateTimesheet } = useTimesheets();
  const { teams } = useTeams(); // was projects

  const [formData, setFormData] = useState<{
    projectId: string;
    date: string; // HTML date input => YYYY-MM-DD
    hoursWorked: string;
    taskDescription: string;
  }>({
    projectId: '',
    date: '',
    hoursWorked: '',
    taskDescription: '',
  });

  const [errors, setErrors] = useState<TimesheetFormErrors>({});
  const [loading, setLoading] = useState(false);

  // Normalize any incoming date-like value to YYYY-MM-DD
  const normalizeDate = (value: string | Date): string => {
    if (!value) return '';
    const d = typeof value === 'string' ? new Date(value) : value;
    // toISOString is safe because backend only cares about the date portion
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!isOpen) return;

    if (editTimesheet) {
      setFormData({
        projectId: editTimesheet.projectId?._id || '',
        date: normalizeDate(editTimesheet.date),
        hoursWorked: editTimesheet.hoursWorked.toString(),
        taskDescription: editTimesheet.taskDescription,
      });
    } else {
      setFormData({
        projectId: '',
        date: normalizeDate(new Date()),
        hoursWorked: '',
        taskDescription: '',
      });
    }
    setErrors({});
    setLoading(false);
  }, [editTimesheet, isOpen]);

  const validateForm = () => {
    const newErrors: TimesheetFormErrors = {};

    if (!formData.projectId) newErrors.projectId = 'Project is required';
    if (!formData.date) newErrors.date = 'Date is required';

    const hours = Number(formData.hoursWorked);
    if (!formData.hoursWorked || isNaN(hours) || hours <= 0 || hours > 24) {
      newErrors.hoursWorked = 'Valid hours (0-24) required';
    }

    if (!formData.taskDescription || formData.taskDescription.length < 10) {
      newErrors.taskDescription = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload: TimesheetFormData = {
        projectId: formData.projectId,
        date: formData.date, // already YYYY-MM-DD from input
        hoursWorked: Number(formData.hoursWorked),
        taskDescription: formData.taskDescription,
      };

      if (editTimesheet) {
        await updateTimesheet(editTimesheet._id, payload);
      } else {
        await createTimesheet(payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      // If backend sends a 400 with message, it will show in console;
      // you can also surface it via toast here if needed.
      console.error('Error saving timesheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const title = editTimesheet ? 'Edit Timesheet' : 'Log Work Hours';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ClockIcon className="w-7 h-7 text-blue-600" />
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <BriefcaseIcon className="w-4 h-4" />
              Project *
            </label>
            <select
              value={formData.projectId}
              onChange={(e) =>
                setFormData({ ...formData, projectId: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={loading}
            >
              <option value="">Select project</option>
              {(teams || []).map((project: any) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.projectId}
              </p>
            )}
          </div>

          {/* Date & Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={loading}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.date}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hours Worked *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.hoursWorked}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hoursWorked: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="8.5"
                disabled={loading}
              />
              {errors.hoursWorked && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.hoursWorked}
                </p>
              )}
            </div>
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Description *
            </label>
            <textarea
              rows={4}
              value={formData.taskDescription}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  taskDescription: e.target.value,
                })
              }
              placeholder="Describe the work completed today..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
              disabled={loading}
            />
            {errors.taskDescription && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.taskDescription}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500 font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>{editTimesheet ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  <span>
                    {editTimesheet ? 'Update Timesheet' : 'Log Work Hours'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimesheetFormModal;
