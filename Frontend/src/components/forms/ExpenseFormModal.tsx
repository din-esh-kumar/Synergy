import { useState, useEffect, useRef, useCallback } from 'react';
import { useExpenseStore } from '../../store/expenseStore';
import type { Expense, FormErrors, User } from '../../types';
import toast from 'react-hot-toast';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: Expense | null;
  employees: User[];
  currentUser: User | null;
  employeesLoading?: boolean;
}

export default function ExpenseFormModal({ 
  isOpen, 
  onClose, 
  editData, 
  employees, 
  currentUser,
  employeesLoading = false 
}: ExpenseFormModalProps) {
  const { createExpense, updateExpense, loading } = useExpenseStore();
  const [formData, setFormData] = useState({ 
    userId: '', 
    date: '', 
    amount: '', 
    description: '', 
    receipt: null as File | null 
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const showUserSelector = isAdmin || isManager;

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) handleClose();
    };

    if (isOpen) {
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
      const today = new Date().toISOString().split('T')[0];
      const initialFormData = {
        userId: editData?.userId || currentUser?.id || '', 
        date: editData?.date?.split('T')[0] || today, 
        amount: editData?.amount?.toString() || '', 
        description: editData?.description || '', 
        receipt: null 
      };

      setFormData(initialFormData);
      setFileName(editData?.receiptUrl ? 'Existing receipt' : '');
      setPreviewUrl(editData?.receiptUrl || '');
      setErrors({});
      setTouched({});
    }
  }, [editData, isOpen, currentUser]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    if (showUserSelector && !formData.userId) {
      newErrors.userId = 'Please select an employee';
    }
    if (!formData.date) newErrors.date = 'Expense date is required';
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else {
      const amountNum = Number(formData.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      } else if (amountNum > 1000000) {
        newErrors.amount = 'Amount cannot exceed 1,000,000';
      } else if (!/^\d+(\.\d{1,2})?$/.test(formData.amount)) {
        newErrors.amount = 'Amount must have at most 2 decimal places';
      }
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (selectedDate > today) {
        newErrors.date = 'Expense date cannot be in the future';
      }

      // Optional: Check if date is too far in the past (e.g., more than 1 year)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (selectedDate < oneYearAgo) {
        newErrors.date = 'Expense date cannot be more than 1 year ago';
      }
    }

    // File validation
    if (formData.receipt) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(formData.receipt.type)) {
        newErrors.receipt = 'Please upload a valid image (JPEG, PNG, GIF, WebP)';
      }
      if (formData.receipt.size > 5 * 1024 * 1024) { // 5MB
        newErrors.receipt = 'File size must be less than 5MB';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, showUserSelector]);

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

  const handleFileChange = useCallback((file: File | null) => {
    if (file) {
      // Validate file type and size immediately
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setFormData(prev => ({ ...prev, receipt: file }));
      setFileName(file.name);
      
      // Create preview URL
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setFormData(prev => ({ ...prev, receipt: null }));
      setFileName('');
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl('');
    }
  }, [previewUrl]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, [handleFileChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = ['userId', 'date', 'amount', 'description', 'receipt'].reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    const isEdit = !!editData;
    const toastId = toast.loading(isEdit ? 'Updating expense...' : 'Creating expense...');

    try {
      const payload = {
        userId: formData.userId,
        date: formData.date,
        amount: Number(formData.amount),
        description: formData.description.trim(),
        receipt: formData.receipt || undefined,
      };

      if (isEdit) {
        await updateExpense(editData.id, payload);
        toast.success('Expense updated successfully!', { id: toastId });
      } else {
        await createExpense(payload);
        toast.success('Expense created successfully!', { id: toastId });
      }

      handleClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(errorMessage, { id: toastId });
      // console.error('Expense form submission failed:', error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      const today = new Date().toISOString().split('T')[0];
      setFormData({ userId: '', date: today, amount: '', description: '', receipt: null });
      setFileName('');
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl('');
      setErrors({});
      setTouched({});
      onClose();
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) handleClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackgroundClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
    >
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl my-8">
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
          <h2 id="expense-modal-title" className="text-xl font-semibold flex items-center">
            <i className="fa-solid fa-money-bill-wave mr-2" aria-hidden="true"></i>
            {editData ? 'Edit Expense' : 'New Expense'}
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
              {employeesLoading || employees.length === 0 ? (
                <div className="flex items-center justify-center border border-gray-300 rounded-lg px-3 py-3 bg-gray-50 text-gray-500 space-x-2">
                  <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                  <span>Loading employees...</span>
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
                  disabled={loading}
                >
                  <option value="">Select employee</option>
                  {employees
                    .filter((emp) => !(isAdmin && emp.id === currentUser?.id))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                        {emp.id === currentUser?.id && ' (You)'}
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

          {/* Expense Date and Amount Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Expense Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                onBlur={() => handleBlur('date')}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.date ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true"></i>
                  {errors.date}
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  onBlur={() => handleBlur('amount')}
                  className={`w-full border rounded-lg pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true"></i>
                  {errors.amount}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
              <span className="text-gray-400 text-xs ml-2">
                {formData.description.length}/500 characters
              </span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-vertical ${
                errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              rows={3}
              placeholder="Describe the expense purpose and details..."
              maxLength={500}
              disabled={loading}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true"></i>
                {errors.description}
              </p>
            )}
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Image
              <span className="text-gray-400 text-xs ml-2">(Optional, max 5MB)</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors mb-3 ${
                errors.receipt 
                  ? 'border-red-300 bg-red-50' 
                  : fileName 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              {fileName ? (
                <div className="text-green-700">
                  <i className="fa-solid fa-file-circle-check text-lg mb-2" aria-hidden="true"></i>
                  <div className="font-medium">{fileName}</div>
                  <div className="text-sm text-green-600 mt-1">Click to change file</div>
                </div>
              ) : (
                <div className="text-gray-600">
                  <i className="fa-solid fa-cloud-arrow-up text-2xl mb-2" aria-hidden="true"></i>
                  <div className="font-medium">Drop receipt image here or click to browse</div>
                  <div className="text-sm text-gray-500 mt-1">Supports: JPEG, PNG, GIF, WebP</div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={e => handleFileChange(e.target.files ? e.target.files[0] : null)}
                className="hidden"
                disabled={loading}
              />
            </div>
            {errors.receipt && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden="true"></i>
                {errors.receipt}
              </p>
            )}

            {/* Preview */}
            {(previewUrl || (editData?.receiptUrl && !formData.receipt)) && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <img 
                    src={previewUrl || editData?.receiptUrl} 
                    alt="Receipt preview" 
                    className="max-h-40 mx-auto rounded shadow-sm object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.alt = 'Preview failed to load';
                      target.classList.add('bg-gray-100', 'p-4');
                    }}
                  />
                </div>
              </div>
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
                  <span>{editData ? 'Update Expense' : 'Create Expense'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}