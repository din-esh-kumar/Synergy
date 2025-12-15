// src/pages/Leaves/LeaveFormModal.tsx
import React, { useState, useEffect } from 'react';
import { useLeaves } from '../../hooks/useLeaves';
import { useAuth } from '../../context/AuthContext';
import { LeaveFormData, LeaveType } from '../../types/leave.types';

interface LeaveFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const defaultForm: LeaveFormData = {
  leaveType: '' as LeaveType,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  reason: '',
  halfDay: false,
};

const LeaveFormModal: React.FC<LeaveFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { applyLeave } = useLeaves();
  const { user } = useAuth();

  const [form, setForm] = useState<LeaveFormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof LeaveFormData, string>>
  >({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...defaultForm,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      });
      setErrors({});
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const next: Partial<Record<keyof LeaveFormData, string>> = {};
    if (!form.leaveType) next.leaveType = 'Leave type is required';
    if (!form.startDate) next.startDate = 'Start date is required';
    if (!form.endDate) next.endDate = 'End date is required';
    if (!form.reason || form.reason.length < 5) {
      next.reason = 'Reason must be at least 5 characters';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // send codes like "SICK", "CASUAL", ...
      await applyLeave(form);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error applying leave:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Apply for Leave
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Leave Type
            </label>
            <select
              value={form.leaveType}
              onChange={(e) =>
                setForm({
                  ...form,
                  leaveType: e.target.value as LeaveType,
                })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">Select type</option>
              <option value="CASUAL">Casual</option>
              <option value="SICK">Sick</option>
              <option value="EARNED">Earned</option>
              <option value="UNPAID">Unpaid</option>
            </select>
            {errors.leaveType && (
              <p className="mt-1 text-xs text-red-600">{errors.leaveType}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm({ ...form, startDate: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
            {errors.startDate && (
              <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) =>
                setForm({ ...form, endDate: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
            {errors.endDate && (
              <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
            )}
          </div>

          {/* Half-day */}
          <div className="flex items-center gap-2">
            <input
              id="halfDay"
              type="checkbox"
              checked={form.halfDay}
              onChange={(e) =>
                setForm({ ...form, halfDay: e.target.checked })
              }
              className="h-4 w-4 text-indigo-600 border-slate-300 rounded"
            />
            <label
              htmlFor="halfDay"
              className="text-sm text-slate-700 dark:text-slate-300"
            >
              Half day
            </label>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reason
            </label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) =>
                setForm({ ...form, reason: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              placeholder="Provide a short explanation..."
            />
            {errors.reason && (
              <p className="mt-1 text-xs text-red-600">{errors.reason}</p>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveFormModal;
