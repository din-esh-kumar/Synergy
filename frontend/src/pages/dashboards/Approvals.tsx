// src/pages/dashboards/Approvals.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { useLeaves } from '../../hooks/useLeaves';
import { useExpenses } from '../../hooks/useExpenses';
import { useTimesheets } from '../../hooks/useTimesheets';
import ConfirmationModal from '../../components/ConfirmationModal';
import ReceiptModal from '../../components/ReceiptModal';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatters';

type ApprovalTab = 'leaves' | 'expenses' | 'timesheets';

interface Tab {
  key: ApprovalTab;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

const TABS: Tab[] = [
  { key: 'leaves', label: 'Leaves', icon: Calendar, color: 'bg-orange-500' },
  { key: 'expenses', label: 'Expenses', icon: DollarSign, color: 'bg-green-500' },
  { key: 'timesheets', label: 'Timesheets', icon: Clock, color: 'bg-blue-500' },
];

// Loading Skeleton Component
const TableSkeleton: React.FC<{ columns?: number; rows?: number }> = ({
  columns = 6,
  rows = 5,
}) => (
  <div className="animate-pulse space-y-4">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4">
        {[...Array(columns)].map((_, j) => (
          <div
            key={j}
            className="h-10 bg-slate-200 dark:bg-slate-700 rounded flex-1"
          ></div>
        ))}
      </div>
    ))}
  </div>
);

const Approvals: React.FC = () => {
  const { fetchAllLeaves, approveLeave, rejectLeave } = useLeaves();
  const { fetchAllExpenses, approveExpense, rejectExpense } = useExpenses();
  const { fetchAllTimesheets, approveTimesheet, rejectTimesheet } =
    useTimesheets();

  const [activeTab, setActiveTab] = useState<ApprovalTab>('leaves');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Data states
  const [leaves, setLeaves] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject' | null;
    itemId: string | null;
    itemType: ApprovalTab | null;
  }>({
    isOpen: false,
    action: null,
    itemId: null,
    itemType: null,
  });

  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    expense: any;
    receiptUrl: string | null;
  }>({
    isOpen: false,
    expense: null,
    receiptUrl: null,
  });

  // Fetch all pending approvals
  useEffect(() => {
    loadAllPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllPending = async () => {
    setIsLoading(true);
    try {
      const [leavesRes, expensesRes, timesheetsRes] = await Promise.all([
        // pending leaves: backend uses "submitted"
        fetchAllLeaves({ status: 'submitted' as any}),
        // pending expenses: backend uses "submitted"
        fetchAllExpenses({ status: 'submitted' as any }),
        // pending timesheets: backend uses "submitted"
        fetchAllTimesheets({ status: 'submitted' as any }),
      ]);

      const leavesData = (leavesRes?.data || leavesRes || []).filter(
        (l: any) => l.status === 'submitted',
      );
      const expensesData = (expensesRes?.data || expensesRes || []).filter(
        (e: any) => e.status === 'submitted',
      );
      const timesheetsData = (timesheetsRes?.data || timesheetsRes || []).filter(
        (t: any) => t.status === 'submitted',
      );

      setLeaves(leavesData);
      setExpenses(expensesData);
      setTimesheets(timesheetsData);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  // Get total pending count
  const getTotalPending = () => {
    return leaves.length + expenses.length + timesheets.length;
  };

  // Handle approval action
  const handleAction = (
    action: 'approve' | 'reject',
    itemId: string,
    type: ApprovalTab,
  ) => {
    setConfirmModal({
      isOpen: true,
      action,
      itemId,
      itemType: type,
    });
  };

  // Confirm approval/rejection
  const confirmAction = async () => {
    const { action, itemId, itemType } = confirmModal;
    if (!action || !itemId || !itemType) return;

    setProcessingId(itemId);
    try {
      if (itemType === 'leaves') {
        if (action === 'approve') {
          await approveLeave(itemId);
          toast.success('Leave approved successfully');
        } else {
          await rejectLeave(itemId, 'Rejected by manager');
          toast.success('Leave rejected');
        }
      } else if (itemType === 'expenses') {
        if (action === 'approve') {
          await approveExpense(itemId);
          toast.success('Expense approved successfully');
        } else {
          await rejectExpense(itemId, 'Rejected by manager');
          toast.success('Expense rejected');
        }
      } else if (itemType === 'timesheets') {
        if (action === 'approve') {
          await approveTimesheet(itemId);
          toast.success('Timesheet approved successfully');
        } else {
          await rejectTimesheet(itemId, 'Rejected by manager');
          toast.success('Timesheet rejected');
        }
      }

      await loadAllPending();
    } catch (error: any) {
      console.error('Error processing approval:', error);
      toast.error(error?.response?.data?.message || 'Failed to process request');
    } finally {
      setProcessingId(null);
      setConfirmModal({
        isOpen: false,
        action: null,
        itemId: null,
        itemType: null,
      });
    }
  };

  // View receipt
  const viewReceipt = (expense: any) => {
    setReceiptModal({
      isOpen: true,
      expense,
      receiptUrl: expense.receiptUrl,
    });
  };

  // Get current items based on active tab
  const currentItems = useMemo(() => {
    switch (activeTab) {
      case 'leaves':
        return leaves;
      case 'expenses':
        return expenses;
      case 'timesheets':
        return timesheets;
      default:
        return [];
    }
  }, [activeTab, leaves, expenses, timesheets]);

  // Render table based on type
  const renderTable = () => {
    if (isLoading) {
      return <TableSkeleton columns={6} rows={5} />;
    }

    if (currentItems.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            All caught up!
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            No pending {activeTab} require your approval.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {activeTab === 'expenses'
                  ? 'Amount'
                  : activeTab === 'leaves'
                  ? 'Duration'
                  : 'Hours'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {activeTab === 'leaves' ? 'Date' : 'Period'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Reason/Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {currentItems.map((item: any) => {
              const isProcessing = processingId === item._id;
              const employeeName =
                item.employee?.name || item.user?.name || 'Unknown';

              return (
                <tr
                  key={item._id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    isProcessing ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {employeeName.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {employeeName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {activeTab === 'expenses'
                        ? `₹${item.amount?.toLocaleString()}`
                        : activeTab === 'leaves'
                        ? `${item.duration || item.days || 0} days`
                        : `${item.hoursWorked ?? item.totalHours ?? 0} hours`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {activeTab === 'leaves'
                        ? `${formatDate(item.startDate)} - ${formatDate(
                            item.endDate,
                          )}`
                        : activeTab === 'expenses'
                        ? formatDate(item.date || item.createdAt)
                        : `${formatDate(item.startDate)} - ${formatDate(
                            item.endDate,
                          )}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {item.reason ||
                        item.description ||
                        item.taskDescription ||
                        'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {activeTab === 'expenses' && item.receiptUrl && (
                      <button
                        onClick={() => viewReceipt(item)}
                        className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="View receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleAction('approve', item._id, activeTab)
                      }
                      disabled={isProcessing}
                      className="text-green-600 hover:text-green-900 dark:hover:text-green-400 transition-colors p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Approve"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        handleAction('reject', item._id, activeTab)
                      }
                      disabled={isProcessing}
                      className="text-red-600 hover:text-red-900 dark:hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reject"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Approvals
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Review and approve pending {activeTab} from your team
                {getTotalPending() > 0 && (
                  <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    {getTotalPending()} pending
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex space-x-1 p-2" aria-label="Tabs">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                const count =
                  tab.key === 'leaves'
                    ? leaves.length
                    : tab.key === 'expenses'
                    ? expenses.length
                    : timesheets.length;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-colors relative ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                    {count > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-orange-500 text-white">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Table Content */}
          <div className="p-6">{renderTable()}</div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            action: null,
            itemId: null,
            itemType: null,
          })
        }
        onConfirm={confirmAction}
        title={`${
          confirmModal.action === 'approve' ? 'Approve' : 'Reject'
        } ${confirmModal.itemType}`}
        message={`Are you sure you want to ${
          confirmModal.action
        } this ${confirmModal.itemType?.slice(0, -1)}?`}
        actionType={confirmModal.action || 'approve'}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModal.isOpen}
        onClose={() =>
          setReceiptModal({ isOpen: false, expense: null, receiptUrl: null })
        }
        receiptUrl={receiptModal.receiptUrl || ''}
        expense={receiptModal.expense || {}}
      />
    </div>
  );
};

export default Approvals;
