// src/pages/Expenses/ExpenseList.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../hooks/useExpenses';
import ExpenseFormModal from '../../pages/Expenses/ExpenseFormModal';
import ReceiptModal from '../../components/ReceiptModal';
import {
  CreditCard as CreditCardIcon,
  Plus as PlusIcon,
  Filter as FilterIcon,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import {
  ExpenseStatus,
  ExpenseCategory,
  Expense,
} from '../../types/expense.types';

// Map UI status (PENDING/APPROVED/REJECTED) to backend values (submitted/approved/rejected)
const uiToApiStatus: Record<ExpenseStatus, 'submitted' | 'approved' | 'rejected'> = {
  PENDING: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Map backend values to UI label + chip class
const getStatusLabelFromApi = (apiStatus: string): string => {
  switch (apiStatus) {
    case 'submitted':
      return 'pending';
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    default:
      return apiStatus;
  }
};

const getStatusClassFromApi = (apiStatus: string): string => {
  switch (apiStatus) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'submitted':
    default:
      return 'bg-yellow-100 text-yellow-800'; // pending
  }
};

const ExpenseList: React.FC = () => {
  const { user } = useAuth();
  const { expenses, fetchMyExpenses, loading } = useExpenses();

  const [showForm, setShowForm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [filters, setFilters] = useState<{
    status: ExpenseStatus | '';
    category: ExpenseCategory | '';
    startDate: string;
    endDate: string;
  }>({
    status: '',
    category: '',
    startDate: '',
    endDate: '',
  });

  const loadExpenses = async () => {
    // Convert UI status to backend status string before sending to API
    const apiStatus =
      filters.status !== '' ? uiToApiStatus[filters.status as ExpenseStatus] : undefined;

    await fetchMyExpenses({
      // @ts-expect-error: backend uses string statuses; hook just forwards query params
      status: apiStatus,
      category: (filters.category || undefined) as ExpenseCategory | undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    });
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const totalAmount = expenses.reduce(
    (sum: number, expense: any) => sum + (expense.amount || 0),
    0,
  );

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CreditCardIcon className="w-8 h-8 text-green-600" />
            Expenses
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and submit your expense claims
            <span className="ml-4 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
              ₹{totalAmount.toLocaleString()} total
            </span>
          </p>
        </div>

        {!isManager && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedExpense(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl shadow-lg hover:bg-green-700 transition-all font-medium"
            >
              <PlusIcon className="w-4 h-4" />
              New Expense
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FilterIcon className="w-4 h-4" />
            Filter Expenses
          </h3>
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as ExpenseStatus | '',
                })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  category: e.target.value as ExpenseCategory | '',
                })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="TRAVEL">Travel</option>
              <option value="FOOD">Food</option>
              <option value="ACCOMMODATION">Accommodation</option>
              <option value="SUPPLIES">Supplies</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="TRAINING">Training</option>
              <option value="OTHER">Other</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  startDate: e.target.value,
                })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  endDate: e.target.value,
                })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Merchant
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
              {expenses.map((expense: any) => {
                const canModify = expense.status === 'submitted' && !isManager;

                return (
                  <tr
                    key={expense._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {expense.date
                          ? new Date(expense.date).toLocaleDateString()
                          : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          expense.category === 'TRAVEL'
                            ? 'bg-blue-100 text-blue-800'
                            : expense.category === 'FOOD'
                            ? 'bg-orange-100 text-orange-800'
                            : expense.category === 'ACCOMMODATION'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        ₹{Number(expense.amount || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="text-sm text-gray-900 dark:text-white max-w-xs truncate"
                        title={expense.merchantName}
                      >
                        {expense.merchantName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClassFromApi(
                          expense.status,
                        )}`}
                      >
                        {getStatusLabelFromApi(expense.status)}
                      </span>
                      {expense.status === 'rejected' &&
                        expense.rejectionReason && (
                          <div className="mt-1 text-xs text-red-500">
                            Reason: {expense.rejectionReason}
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {expense.receipt && (
                        <button
                          onClick={() => {
                            setSelectedExpense(expense);
                            setShowReceipt(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3 inline-flex items-center"
                        >
                          <ReceiptIcon className="w-4 h-4 mr-1" />
                          Receipt
                        </button>
                      )}

                      {canModify && (
                        <button
                          onClick={() => {
                            setSelectedExpense(expense);
                            setShowForm(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {expenses.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No expenses found for the selected filters.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading expenses...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ExpenseFormModal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedExpense(null);
          }}
          expense={selectedExpense || undefined}
          onSuccess={async () => {
            setShowForm(false);
            setSelectedExpense(null);
            await loadExpenses();
          }}
        />
      )}

      {showReceipt && selectedExpense && (
        <ReceiptModal
          isOpen={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            setSelectedExpense(null);
          }}
          receiptUrl={selectedExpense.receipt ?? ''}
          expense={selectedExpense}
        />
      )}
    </div>
  );
};

export default ExpenseList;
