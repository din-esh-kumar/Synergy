import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useLeaveStore } from '../../store/leaveStore';
import type { Leave, CreateLeaveData, FormErrors, User } from '../../types';

interface LeaveFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: Leave | null;
  employees: User[];
  currentUser: User | null;
  employeesLoading?: boolean;
}

export default function LeaveFormModal({ 
  isOpen, 
  onClose, 
  editData, 
  employees, 
  currentUser,
  employeesLoading = false 
}: LeaveFormModalProps) {
  const { createLeave, updateLeave, loading, leaveTypes, fetchLeaveTypes } = useLeaveStore();
  const [formData, setFormData] = useState<CreateLeaveData & { userId?: string }>({
    userId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const showUserSelector = isAdmin || isManager;

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) handleClose();
    };

    if (isOpen) {
      fetchLeaveTypes();
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading]);

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      const initialFormData: CreateLeaveData & { userId?: string } = {
        userId: editData?.userId || currentUser?.id || '',
        leaveTypeId: editData?.leaveTypeId || '',
        startDate: editData?.startDate?.split('T')[0] || '',
        endDate: editData?.endDate?.split('T')[0] || '',
        reason: editData?.reason || '',
      };

      // Set default user for new leave applications
      if (!editData && showUserSelector && employees.length > 0) {
        if (isManager) {
          initialFormData.userId = currentUser.id;
        } else if (isAdmin) {
          const firstEmployee = employees.find(emp => emp.id !== currentUser?.id) || employees[0];
          initialFormData.userId = firstEmployee.id;
        }
      }

      setFormData(initialFormData);
      setErrors({});
      setTouched({});
    }
  }, [isOpen, editData, currentUser, employees, showUserSelector, isManager, isAdmin]);

  // Set default leave type
  useEffect(() => {
    if (isOpen && leaveTypes.length > 0 && !formData.leaveTypeId && !editData) {
      setFormData(prev => ({
        ...prev,
        leaveTypeId: leaveTypes[0].id
      }));
    }
  }, [leaveTypes, isOpen, editData, formData.leaveTypeId]);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    if (showUserSelector && !formData.userId) {
      newErrors.userId = 'Please select an employee';
    }
    if (!formData.leaveTypeId) newErrors.leaveTypeId = 'Leave type is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start > end) {
        newErrors.endDate = 'End date cannot be before start date';
      }
      if (start < today) {
        newErrors.startDate = 'Cannot apply for leave in the past';
      }

      // Calculate leave duration
      const timeDiff = end.getTime() - start.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      
      if (dayDiff < 1) {
        newErrors.endDate = 'Leave must be at least 1 day';
      }

      // Check against selected leave type max days
      const selectedLeaveType = leaveTypes.find(lt => lt.id === formData.leaveTypeId);
      if (selectedLeaveType?.maxDays && dayDiff > selectedLeaveType.maxDays) {
        newErrors.endDate = `Leave duration cannot exceed ${selectedLeaveType.maxDays} days for ${selectedLeaveType.name}`;
      }
    }
    
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (formData.reason.length > 500) {
      newErrors.reason = 'Reason must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, showUserSelector, leaveTypes]);

  // Validate when form data changes and fields are touched
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
    const allTouched = ['userId', 'leaveTypeId', 'startDate', 'endDate', 'reason'].reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    const toastId = toast.loading(editData ? 'Updating leave…' : 'Creating leave…');

    try {
      const payload = {
        ...formData,
        userId: showUserSelector ? formData.userId : currentUser?.id
      };

      if (editData) {
        await updateLeave(editData.id, payload);
        toast.success('Leave updated successfully!', { id: toastId });
      } else {
        await createLeave(payload);
        toast.success('Leave applied successfully!', { id: toastId });
      }
      handleClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(errorMessage, { id: toastId });
      // console.error('Leave submission error:', err);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ userId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      setErrors({});
      setTouched({});
      onClose();
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) handleClose();
  };

  // Calculate leave duration
  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const timeDiff = end.getTime() - start.getTime();
      return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    }
    return 0;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackgroundClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-modal-title"
    >
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl my-8">
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
          <h2 id="leave-modal-title" className="text-xl font-semibold flex items-center">
            <i className="fa-solid fa-calendar-days mr-2" aria-hidden="true"></i>
            {editData ? 'Edit Leave' : 'New Leave'}
          </h2>
          <button 
            onClick={handleClose} 
            className="text-white hover:text-gray-200 text-2xl transition-colors disabled:opacity-50"
            disabled={loading}
            aria-label="Close modal"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Employee Selector */}
          {showUserSelector && (
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
                <div className="flex items-center justify-center border border-gray-300 rounded-lg px-3 py-3 bg-gray-50 text-gray-500">
                  <span>No employees available</span>
                </div>
              ) : (
                <select
                  value={formData.userId}
                  onChange={(e) => handleChange('userId', e.target.value)}
                  onBlur={() => handleBlur('userId')}
                  className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.userId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                  disabled={loading || !!editData}
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} 
                      {emp.id === currentUser?.id && ' (You)'}
                      {emp.managerId === currentUser?.id && emp.id !== currentUser?.id && ' (Team Member)'}
                    </option>
                  ))}
                </select>
              )}
              {errors.userId && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true"></i>
                  {errors.userId}
                </p>
              )}
            </div>
          )}

          {/* Leave Type and Duration Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type <span className="text-red-500">*</span>
              </label>
              {leaveTypes.length === 0 ? (
                <div className="flex items-center justify-center border border-gray-300 rounded-lg px-3 py-3 bg-gray-50 text-gray-500 space-x-2">
                  <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                  <span>Loading leave types...</span>
                </div>
              ) : (
                <select
                  value={formData.leaveTypeId}
                  onChange={(e) => handleChange('leaveTypeId', e.target.value)}
                  onBlur={() => handleBlur('leaveTypeId')}
                  className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.leaveTypeId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                  disabled={loading || (!!editData && editData.status !== 'draft')}
                >
                  <option value="">Select leave type</option>
                  {leaveTypes
                    .filter(lt => lt.isActive)
                    .map((lt) => (
                      <option key={lt.id} value={lt.id}>
                        {lt.name} {lt.maxDays > 0 ? `(Max: ${lt.maxDays} days)` : ''}
                      </option>
                    ))}
                </select>
              )}
              {errors.leaveTypeId && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true"></i>
                  {errors.leaveTypeId}
                </p>
              )}
            </div>

            {/* Duration Display */}
            {formData.startDate && formData.endDate && calculateDuration() > 0 && (
              <div className="col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <span className="text-sm font-medium text-blue-800">
                    Duration: {calculateDuration()} day{calculateDuration() !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                onBlur={() => handleBlur('startDate')}
                className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.startDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                min={new Date().toISOString().split('T')[0]}
                required
                disabled={loading}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true"></i>
                  {errors.startDate}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                onBlur={() => handleBlur('endDate')}
                className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.endDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                required
                disabled={loading}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true"></i>
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
              <span className="text-gray-400 text-xs ml-2">
                {formData.reason.length}/500 characters
              </span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              onBlur={() => handleBlur('reason')}
              className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-vertical ${
                errors.reason ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              rows={3}
              placeholder="Describe your leave reason..."
              maxLength={500}
              disabled={loading}
            />
            {errors.reason && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true"></i>
                {errors.reason}
              </p>
            )}
          </div>

          {/* Actions */}
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
              disabled={loading || leaveTypes.length === 0}
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
                  <span>{editData ? 'Update Leave' : 'Apply Leave'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}