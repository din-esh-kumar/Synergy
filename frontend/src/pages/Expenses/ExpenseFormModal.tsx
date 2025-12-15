// src/pages/Expenses/ExpenseFormModal.tsx
import React, { useState, useEffect } from 'react';
import { useExpenses } from '../../hooks/useExpenses';
import { useTeams } from '../../hooks/useTeams';
import {
  X,
  Check as CheckIcon,
  CreditCard,
  Upload,
  Receipt,
} from 'lucide-react';
import {
  ExpenseFormData,
  ExpenseCategory,
  Expense,
} from '../../types/expense.types';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // NEW: when provided, modal acts as “edit expense”
  expense?: Expense;
}

type ExpenseFormErrors = Partial<
  Record<'category' | 'amount' | 'date' | 'description', string>
>;

const defaultForm: ExpenseFormData = {
  category: '' as ExpenseCategory,
  amount: 0,
  currency: 'INR',
  date: new Date().toISOString().split('T')[0],
  description: '',
  projectId: '',
  merchantName: '',
  receipt: undefined,
};

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expense,
}) => {
  const { createExpense, updateExpense } = useExpenses();
  const { teams } = useTeams();

  const [formData, setFormData] = useState<ExpenseFormData>(defaultForm);
  const [receiptFile, setReceiptFile] = useState<File | undefined>(undefined);
  const [errors, setErrors] = useState<ExpenseFormErrors>({});
  const [loading, setLoading] = useState(false);

  // Reset / prefill when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (expense) {
      // Editing existing expense
      setFormData({
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency || 'INR',
        date: new Date(expense.date).toISOString().split('T')[0],
        description: expense.description,
        projectId: expense.projectId?._id || '',
        merchantName: expense.merchantName || '',
        receipt: undefined,
      });
    } else {
      // Creating new expense
      setFormData({
        ...defaultForm,
        date: new Date().toISOString().split('T')[0],
      });
    }

    setReceiptFile(undefined);
    setErrors({});
  }, [isOpen, expense]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setReceiptFile(file);
  };

  const validateForm = () => {
    const newErrors: ExpenseFormErrors = {};

    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount required';
    }
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.description || formData.description.length < 10) {
      newErrors.description =
        'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (expense) {
        // Update existing expense
        await updateExpense(expense._id, {
          ...formData,
          amount: Number(formData.amount),
          // backend treats missing receipt as "keep existing"
          receipt: receiptFile,
        } as any);
      } else {
        // Create new expense
        await createExpense({
          ...formData,
          amount: Number(formData.amount),
          receipt: receiptFile,
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <CreditCard className="w-7 h-7 text-green-600" />
              {expense ? 'Edit Expense Claim' : 'Submit Expense Claim'}
            </h2>
            <button
              onClick={onClose}
              type="button"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
          noValidate
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as ExpenseCategory,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={loading}
              >
                <option value="">Select category</option>
                <option value="TRAVEL">Travel</option>
                <option value="FOOD">Food</option>
                <option value="ACCOMMODATION">Accommodation</option>
                <option value="SUPPLIES">Supplies</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="TRAINING">Training</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: e.target.value as unknown as number,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="1500.00"
                disabled={loading}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.amount}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    date: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                Merchant
              </label>
              <input
                type="text"
                value={formData.merchantName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    merchantName: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Uber, Swiggy, etc."
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project (Optional)
            </label>
            <select
              value={formData.projectId || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  projectId: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={loading}
            >
              <option value="">No project</option>
              {(teams || []).map((project: any) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              placeholder="Provide details about this expense..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
              disabled={loading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description}
              </p>
            )}
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Receipt (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 hover:border-green-400 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="receipt"
                disabled={loading}
              />
              <label
                htmlFor="receipt"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Click to upload receipt
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  PNG, JPG, PDF up to 5MB
                </p>
              </label>
            </div>
            {receiptFile && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    {receiptFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptFile(undefined);
                    }}
                    className="text-green-600 hover:text-green-900 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-500 font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  <span>
                    {expense ? 'Update Expense Claim' : 'Submit Expense Claim'}
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

export default ExpenseFormModal;
