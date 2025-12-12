// src/pages/EMS/Expenses/ExpenseList.tsx - FULL EXPENSE PAGE
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useExpenses } from '../../../hooks/useExpenses';
import ExpenseFormModal from '../../../components/EMS/Expenses/ExpenseFormModal';
import ReceiptModal from '../../../components/EMS/ReceiptModal';
import {
  CreditCardIcon,
  PlusIcon,
  FilterIcon,
  ReceiptIcon
} from 'lucide-react';

const ExpenseList: React.FC = () => {
  const { user } = useAuth();
  const { 
    expenses, 
    fetchMyExpenses, 
    loading 
  } = useExpenses();

  const [showForm, setShowForm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [filters, setFilters] = useState({ 
    status: '', 
    category: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchMyExpenses(filters);
  }, [filters]);

  const totalAmount = expenses.reduce((sum, expense: any) => sum + (expense.amount || 0), 0);

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
              onClick={() => setShowForm(true)}
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
          <h3 className="font-semibold text-gray-900 dark:text-white">Filter Expenses</h3>
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="TRAVEL">Travel</option>
              <option value="FOOD">Food</option>
              <option value="ACCOMMODATION">Accommodation</option>
              <option value="SUPPLIES">Supplies</option>
              <option value="OTHER">Other</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
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
              {expenses.map((expense: any) => (
                <tr key={expense._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      expense.category === 'TRAVEL' ? 'bg-blue-100 text-blue-800' :
                      expense.category === 'FOOD' ? 'bg-orange-100 text-orange-800' :
                      expense.category === 'ACCOMMODATION' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      ₹{expense.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate" title={expense.merchantName}>
                      {expense.merchantName || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      expense.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {expense.receipt && (
                      <button
                        onClick={() => {
                          setSelectedExpense(expense);
                          setShowReceipt(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3 flex items-center"
                      >
                        <ReceiptIcon className="w-4 h-4 mr-1" />
                        Receipt
                      </button>
                    )}
                    {expense.status === 'PENDING' && (
                      <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ExpenseFormModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchMyExpenses(filters);
          }}
        />
      )}

      {showReceipt && selectedExpense && (
        <ReceiptModal
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          receiptUrl={selectedExpense.receipt}
          expense={selectedExpense}
        />
      )}
    </div>
  );
};

export default ExpenseList;
