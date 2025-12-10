import React, { useState, useEffect, useCallback } from 'react';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import type { Timesheet, FormErrors, User } from '../../types';
import toast from 'react-hot-toast';

interface TimesheetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: Timesheet | null;
  employees: User[];
  currentUser: User | null;
  employeesLoading?: boolean;
}

export default function TimesheetFormModal({
  isOpen,
  onClose,
  editData,
  employees,
  currentUser,
  employeesLoading = false,
}: TimesheetFormModalProps) {
  const { createTimesheet, updateTimesheet, loading } = useTimesheetStore();
  const { projects, fetchProjectsIsActive, loading: projectsLoading } = useProjectStore();

  const [formData, setFormData] = useState({
    userId: '',
    projectId: '',
    date: '',
    hours: '',
    description: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const showUserSelector = isAdmin || isManager;

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading, onClose]);

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      fetchProjectsIsActive();
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        userId: editData?.userId || currentUser?.id || '',
        projectId: editData?.projectId || '',
        date: editData?.date?.split('T')[0] || today,
        hours: editData?.hours ? String(editData.hours) : '',
        description: editData?.description || '',
      });
      setErrors({});
      setTouched({});
    }
  }, [isOpen, editData, currentUser, fetchProjectsIsActive]);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    if (showUserSelector && !formData.userId) {
      newErrors.userId = 'Please select an employee';
    }
    if (!formData.projectId) newErrors.projectId = 'Please select a project';
    if (!formData.date) newErrors.date = 'Please select a date';

    const hoursNum = parseFloat(formData.hours);
    if (!formData.hours) {
      newErrors.hours = 'Hours are required';
    } else if (isNaN(hoursNum) || hoursNum <= 0) {
      newErrors.hours = 'Hours must be greater than 0';
    } else if (hoursNum > 24) {
      newErrors.hours = 'Hours cannot exceed 24';
    } else if (hoursNum < 0.5) {
      newErrors.hours = 'Hours must be at least 0.5';
    } else if (Math.round(hoursNum * 2) / 2 !== hoursNum) {
      newErrors.hours = 'Hours must be in 0.5 increments';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, showUserSelector]);

  // Validate on form data change when fields are touched
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      validate();
    }
  }, [formData, touched, validate]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    const payload = {
      ...formData,
      hours: parseFloat(formData.hours),
      date: formData.date,
      ...(showUserSelector && { userId: formData.userId })
    };

    try {
      if (editData) {
        await updateTimesheet(editData.id, payload);
        toast.success('Timesheet updated successfully!');
      } else {
        await createTimesheet(payload);
        toast.success('Timesheet created successfully!');
      }
      handleClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save timesheet';
      toast.error(errorMessage);
      // console.error('Timesheet submission error:', err);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackgroundClick}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="timesheet-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <h2 id="timesheet-modal-title" className="text-xl font-semibold">
            <i className="fa-solid fa-clock mr-2" aria-hidden="true"></i>
            {editData ? 'Edit Timesheet' : 'New Timesheet'}
          </h2>
          <button 
            onClick={handleClose} 
            aria-label="Close modal" 
            className="text-white hover:text-gray-200 text-2xl transition-colors disabled:opacity-50"
            disabled={loading}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Employee Selector */}
          {showUserSelector ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee <span className="text-red-500">*</span>
              </label>

              {employeesLoading ? (
                <div className="flex items-center justify-center border border-gray-300 rounded-lg px-3 py-3 bg-gray-50 text-gray-500 space-x-2">
                  <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                  <span>Loading employees...</span>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center border border-gray-300 rounded-lg px-3 py-3 bg-gray-50 text-gray-500">
                  <span>No employees available</span>
                </div>
              ) : (
                <select
                  value={formData.userId}
                  onChange={(e) => handleChange('userId', e.target.value)}
                  onBlur={() => handleBlur('userId')}
                  className={`w-full rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.userId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                  disabled={loading}
                >
                  <option value="">Select employee</option>
                  {employees
                    .filter((u) => !(isAdmin && u.id === currentUser?.id))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                        {emp.id === currentUser?.id && ' (You)'}
                      </option>
                    ))}
                </select>
              )}
              {errors.userId && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true"></i>
                  {errors.userId}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
              <input
                type="text"
                readOnly
                value={`${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
          )}

          {/* Project Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project <span className="text-red-500">*</span>
            </label>

            {projectsLoading ? (
              <div className="flex items-center justify-center border border-gray-300 rounded-lg px-3 py-3 bg-gray-50 text-gray-500 space-x-2">
                <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                <span>Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center border border-gray-300 rounded-lg px-3 py-3 bg-gray-50 text-gray-500">
                <span>No active projects found</span>
              </div>
            ) : (
              <select
                value={formData.projectId}
                onChange={(e) => handleChange('projectId', e.target.value)}
                onBlur={() => handleBlur('projectId')}
                className={`w-full rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.projectId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                required
                disabled={loading}
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            )}

            {errors.projectId && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true"></i>
                {errors.projectId}
              </p>
            )}
          </div>

          {/* Date and Hours Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                onBlur={() => handleBlur('date')}
                className={`w-full rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.date ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                required
                disabled={loading}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.date && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true"></i>
                  {errors.date}
                </p>
              )}
            </div>

            {/* Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                placeholder="8.0"
                value={formData.hours}
                onChange={(e) => handleChange('hours', e.target.value)}
                onBlur={() => handleBlur('hours')}
                className={`w-full rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.hours ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                required
                disabled={loading}
              />
              {errors.hours && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true"></i>
                  {errors.hours}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
              <span className="text-gray-400 text-xs ml-2">
                {formData.description.length}/1000 characters
              </span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              rows={4}
              placeholder="Describe work done, tasks completed, or any relevant details..."
              className={`w-full rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-vertical ${
                errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              required
              disabled={loading}
              maxLength={1000}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true"></i>
                {errors.description}
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-5 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check" aria-hidden="true"></i>
                  <span>{editData ? 'Update Timesheet' : 'Create Timesheet'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}