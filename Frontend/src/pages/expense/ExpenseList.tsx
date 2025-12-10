import { useEffect, useState, useMemo } from 'react';
import { useExpenseStore } from '../../store/expenseStore';
import ExpenseFormModal from '../../components/forms/ExpenseFormModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useAuthStore } from '../../store/authStore';
import type { Expense, User } from '../../types';
import ReceiptModal from "../../components/ReceiptModal";
import RejectedReasonTooltip from '../../components/RejectedReasonTooltip';
import toast from 'react-hot-toast';
import apiClient from '../../config/api';

export default function ExpenseList() {
  const {
    expenses,
    loading,
    initialLoading,
    error,
    fetchExpenses,
    deleteExpense,
    submitExpense,
    clearError,
  } = useExpenseStore();

  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Expense | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [receiptModal, setReceiptModal] = useState<{ isOpen: boolean; imageUrl: string | null }>({
    isOpen: false,
    imageUrl: null,
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'submit' | null;
    itemId: string | null;
  }>({ isOpen: false, type: null, itemId: null });

  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', search: '' });

  // Fetch employees based on user role
  const fetchEmployees = async () => {
    if (!user) return;
    setEmployeesLoading(true);
    try {
      const response = await apiClient.get<{ data: User[] }>('/api/user');
      setEmployees(response.data.data);
    } catch (err) {
      // console.error('Failed to fetch employees', err);
      toast.error('Failed to load employees');
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    if (user?.role === 'admin' || user?.role === 'manager') {
      fetchEmployees();
    }
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Determine which expenses to show based on user role
  const expensesToShow = useMemo(() => {
    if (user?.role === 'admin') {
      return expenses.filter(expense => expense.userId !== user.id);
    } else if (user?.role === 'manager') {
      const managedEmployeeIds = employees
        .filter(emp => emp.managerId === user.id)
        .map(emp => emp.id);

      return expenses.filter(expense =>
        expense.userId === user.id || managedEmployeeIds.includes(expense.userId)
      );
    } else {
      return expenses.filter(expense => expense.userId === user?.id);
    }
  }, [expenses, user, employees]);

  const filteredExpenses = useMemo(() => {
    return expensesToShow.filter((expense) => {
      const matchesStatus = filters.status === 'all' || expense.status === filters.status;
      const matchesSearch =
        expense.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        String(expense.amount).toLowerCase().includes(filters.search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [expensesToShow, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  // Calculate empty rows to maintain consistent height
  const emptyRows = Math.max(0, itemsPerPage - paginatedExpenses.length);

  // Get employee name by ID
  const getEmployeeName = (userId: string) => {
    const employee = employees.find(emp => emp.id === userId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown User';
  };

  const handleDelete = (id: string) => {
    setConfirmModal({ isOpen: true, type: 'delete', itemId: id });
  };

  const handleSubmit = (id: string) => {
    setConfirmModal({ isOpen: true, type: 'submit', itemId: id });
  };

  const handleEdit = (expense: Expense) => {
    setEditData(expense);
    setShowForm(true);
  };

  const handleCloseForm = async () => {
    setShowForm(false);
    setEditData(null);
    await fetchExpenses();
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.itemId) return;

    const action = confirmModal.type === 'delete' ? 'Deleting expense…' : 'Submitting expense…';
    const toastId = toast.loading(action);

    setActionLoading(true);
    try {
      if (confirmModal.type === 'delete') {
        await deleteExpense(confirmModal.itemId);
        toast.success('Expense deleted successfully!', { id: toastId });
      } else if (confirmModal.type === 'submit') {
        await submitExpense(confirmModal.itemId);
        toast.success('Expense submitted successfully!', { id: toastId });
      }

      await fetchExpenses();
      setConfirmModal({ isOpen: false, type: null, itemId: null });
    } catch (error) {
      // console.error('Action failed:', error);
      toast.error('Action failed. Please try again.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800',
      draft: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Update page title based on user role
  useEffect(() => {
    if (user?.role === 'admin') {
      document.title = 'All Expenses - Expense Management';
    } else if (user?.role === 'manager') {
      document.title = 'Team Expenses - Expense Management';
    } else {
      document.title = 'My Expenses - Expense Management';
    }
  }, [user]);

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Page Header - Same as LeaveList */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 truncate">
            {user?.role === 'admin' ? 'All Expenses' :
              user?.role === 'manager' ? 'Team Expenses' : 'My Expenses'}
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            {user?.role === 'admin' ? 'Manage all employee expenses' :
              user?.role === 'manager' ? 'Manage your team expenses' : 'Submit, manage & track your expense claims'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition shadow-md hover:shadow-lg flex-shrink-0"
        >
          <i className="fa-solid fa-plus"></i>
          <span>New Expense</span>
        </button>
      </div>

      {/* Filters - Same as LeaveList */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <i className="fa-solid fa-search absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by description or amount..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          Showing {filteredExpenses.length} of {expensesToShow.length} expenses
        </div>
      </div>

      {/* Expense Table with Fixed Height - Same as LeaveList */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full divide-y divide-gray-200 min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  #
                </th>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Employee
                  </th>
                )}
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Description</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Receipt</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Status</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && expenses.length === 0 ? (
                // Skeleton Rows while loading - exactly 10 rows
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse h-12">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-6"></div>
                    </td>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                    )}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded max-w-xs"></div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right">
                      <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedExpenses.length === 0 && !loading ? (
                <tr className="h-12">
                  <td
                    colSpan={user?.role === 'admin' || user?.role === 'manager' ? 8 : 7}
                    className="text-center py-8 text-gray-500"
                  >
                    No expenses found.
                  </td>
                </tr>
              ) : (
                <>
                  {/* Actual data rows */}
                  {paginatedExpenses.map((expense, index) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition h-12">
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {startIndex + index + 1}
                      </td>
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span className="truncate">{getEmployeeName(expense.userId)}</span>
                            {expense.userId === user?.id && (
                              <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded flex-shrink-0">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap text-sm">{formatDate(expense.createdAt)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                        ₹{expense.amount}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 truncate max-w-[200px]" title={expense.description}>
                        {expense.description || 'No description'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {expense.receiptUrl ? (
                          <button
                            onClick={() => setReceiptModal({ isOpen: true, imageUrl: expense.receiptUrl ?? null })}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
                            title="View receipt"
                          >
                            <i className="fa-solid fa-receipt mr-1"></i>
                            View
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">No receipt</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                          {expense.status?.charAt(0).toUpperCase() + expense.status?.slice(1) || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          {/* Only show edit/delete/submit actions for user's own expenses or if admin/manager */}
                          {(expense.userId === user?.id || user?.role === 'admin' || user?.role === 'manager') && (
                            <>
                              {expense.status === 'draft' && (
                                <>
                                  <button
                                    onClick={() => handleEdit(expense)}
                                    className="text-blue-600 hover:text-blue-900 transition"
                                    title="Edit expense"
                                  >
                                    <i className="fa-solid fa-pen-to-square text-sm"></i>
                                  </button>
                                  <button
                                    onClick={() => handleSubmit(expense.id)}
                                    className="text-green-600 hover:text-green-900 transition"
                                    title="Submit for approval"
                                  >
                                    <i className="fa-solid fa-paper-plane text-sm"></i>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(expense.id)}
                                    className="text-red-600 hover:text-red-900 transition"
                                    title="Delete expense"
                                  >
                                    <i className="fa-solid fa-trash text-sm"></i>
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          {expense.status === 'submitted' && (
                            <span className="text-gray-400 text-xs italic">Pending approval</span>
                          )}
                          {expense.status === 'approved' && (
                            <span className="text-green-600 text-xs flex items-center">
                              <i className="fa-solid fa-check-circle mr-1"></i>Approved
                            </span>
                          )}
                          {expense.status === 'rejected' && (
                            <RejectedReasonTooltip reason={expense.rejectionReason ?? undefined} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Empty rows to maintain consistent height */}
                  {emptyRows > 0 && Array.from({ length: emptyRows }).map((_, index) => (
                    <tr key={`empty-${index}`} className="h-12 border-b border-gray-200">
                      <td colSpan={user?.role === 'admin' || user?.role === 'manager' ? 8 : 7} className="px-3 py-3"></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Same as LeaveList */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:flex-1 sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + itemsPerPage, filteredExpenses.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredExpenses.length}</span> results
                </p>
              </div>
              <div className="flex space-x-2 justify-center sm:justify-end">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md ${currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <ExpenseFormModal
          isOpen={showForm}
          onClose={handleCloseForm}
          editData={editData}
          employees={employees}
          currentUser={user}
          employeesLoading={employeesLoading}
        />
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModal.isOpen}
        imageUrl={receiptModal.imageUrl}
        onClose={() => setReceiptModal({ isOpen: false, imageUrl: null })}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null, itemId: null })}
        onConfirm={handleConfirmAction}
        title={confirmModal.type === 'delete' ? 'Delete Expense' : 'Submit Expense'}
        message={
          confirmModal.type === 'delete'
            ? 'Are you sure you want to delete this expense? This action cannot be undone.'
            : "Are you sure you want to submit this expense for approval? You won't be able to edit it after submission."
        }
        confirmText={confirmModal.type === 'delete' ? 'Delete' : 'Submit'}
        confirmColor={confirmModal.type === 'delete' ? 'red' : 'green'}
        loading={actionLoading}
      />
    </div>
  );
}


























































// // src/pages/expenses/ExpenseList.tsx
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Plus, Search, Receipt, Trash2, Edit, Eye } from 'lucide-react';
// import { useExpenseStore } from '../../store/expenseStore';
// import toast from 'react-hot-toast';

// const ExpenseList: React.FC = () => {
//   const navigate = useNavigate();
//   const { expenses = [], deleteExpense } = useExpenseStore();
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterCategory, setFilterCategory] = useState('all');

//   const filteredExpenses = expenses?.filter((exp) => {
//     const matchesSearch = exp?.title?.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesCategory = filterCategory === 'all' || exp?.category === filterCategory;
//     return matchesSearch && matchesCategory;
//   }) || [];

//   const handleDelete = (id: string) => {
//     if (confirm('Delete this expense?')) {
//       deleteExpense(id);
//       toast.success('Expense deleted');
//     }
//   };

//   const getCategoryColor = (category: string) => {
//     const colors: { [key: string]: string } = {
//       travel: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
//       meals: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
//       supplies: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
//       equipment: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
//       other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
//     };
//     return colors[category] || colors.other;
//   };

//   const getStatusColor = (status: string) => {
//     const colors: { [key: string]: string } = {
//       draft: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
//       submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
//       approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
//       rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
//     };
//     return colors[status] || colors.draft;
//   };

//   const totalAmount = filteredExpenses.reduce((sum, exp) => sum + (exp?.amount || 0), 0);
//   const approvedAmount = filteredExpenses
//     .filter((exp) => exp.status === 'approved')
//     .reduce((sum, exp) => sum + (exp?.amount || 0), 0);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Expenses</h1>
//           <p className="text-slate-600 dark:text-slate-400">Track and manage your expenses</p>
//         </div>
//         <button
//           onClick={() => navigate('/expenses/new')}
//           className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
//         >
//           <Plus className="w-5 h-5" />
//           New Expense
//         </button>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-2">
//             <Receipt className="w-4 h-4" />
//             Total Expenses
//           </p>
//           <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
//             ₹{totalAmount.toFixed(2)}
//           </p>
//         </div>
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm">Pending</p>
//           <p className="text-3xl font-bold text-orange-600 mt-2">
//             {expenses?.filter((exp) => exp.status === 'submitted').length || 0}
//           </p>
//         </div>
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm">Approved Amount</p>
//           <p className="text-3xl font-bold text-green-600 mt-2">
//             ₹{approvedAmount.toFixed(2)}
//           </p>
//         </div>
//       </div>

//       {/* Search & Filter */}
//       <div className="flex flex-col md:flex-row gap-4">
//         <div className="flex-1 relative">
//           <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//           <input
//             type="text"
//             placeholder="Search expenses..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           />
//         </div>
//         <select
//           value={filterCategory}
//           onChange={(e) => setFilterCategory(e.target.value)}
//           className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//         >
//           <option value="all">All Categories</option>
//           <option value="travel">Travel</option>
//           <option value="meals">Meals</option>
//           <option value="supplies">Supplies</option>
//           <option value="equipment">Equipment</option>
//           <option value="other">Other</option>
//         </select>
//       </div>

//       {/* Expenses Table */}
//       <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
//         {filteredExpenses.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Description
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Category
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Amount
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredExpenses.map((exp) => (
//                   <tr
//                     key={exp.id}
//                     className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
//                   >
//                     <td className="px-6 py-4">
//                       <div>
//                         <p className="font-semibold text-slate-900 dark:text-white">{exp.title}</p>
//                         <p className="text-sm text-slate-600 dark:text-slate-400">
//                           {exp.date && new Date(exp.date).toLocaleDateString()}
//                         </p>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(exp.category)}`}>
//                         {exp.category}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
//                       ₹{exp.amount?.toFixed(2)}
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(exp.status)}`}>
//                         {exp.status}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="flex items-center gap-2">
//                         <button
//                           onClick={() => navigate(`/expenses/${exp.id}`)}
//                           className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors"
//                           title="View"
//                         >
//                           <Eye className="w-4 h-4" />
//                         </button>
//                         {exp.status === 'draft' && (
//                           <>
//                             <button
//                               onClick={() => navigate(`/expenses/${exp.id}/edit`)}
//                               className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded transition-colors"
//                               title="Edit"
//                             >
//                               <Edit className="w-4 h-4" />
//                             </button>
//                             <button
//                               onClick={() => handleDelete(exp.id)}
//                               className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
//                               title="Delete"
//                             >
//                               <Trash2 className="w-4 h-4" />
//                             </button>
//                           </>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div className="text-center py-12">
//             <p className="text-slate-600 dark:text-slate-400 mb-4">No expenses found</p>
//             <button
//               onClick={() => navigate('/expenses/new')}
//               className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
//             >
//               Create First Expense
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ExpenseList;