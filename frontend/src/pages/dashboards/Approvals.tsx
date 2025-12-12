// src/pages/EMS/Approvals/Approvals.tsx - TAB-BASED APPROVALS
import React, { useState, useEffect } from 'react';
import { useLeaves } from '../../../hooks/useLeaves';
import { useExpenses } from '../../../hooks/useExpenses';
import { useTimesheets } from '../../../hooks/useTimesheets';
import {
  CalendarDaysIcon,
  CreditCardIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';
import LeaveFormModal from '../../../components/EMS/Leaves/LeaveFormModal';
import ExpenseFormModal from '../../../components/EMS/Expenses/ExpenseFormModal';
import ConfirmationModal from '../../../components/EMS/ConfirmationModal';

const Approvals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leaves' | 'expenses' | 'timesheets'>('leaves');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  const { fetchLeaveApplications, approveLeave, rejectLeave } = useLeaves();
  const { fetchAllExpenses, approveExpense, rejectExpense } = useExpenses();
  const { fetchAllTimesheets, approveTimesheet, rejectTimesheet } = useTimesheets();

  const [leaves, setLeaves] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);

  useEffect(() => {
    loadApprovals();
  }, [activeTab]);

  const loadApprovals = async () => {
    try {
      const [leaveData, expenseData, timesheetData] = await Promise.all([
        fetchLeaveApplications('PENDING'),
        fetchAllExpenses({ status: 'PENDING' }),
        fetchAllTimesheets({ status: 'SUBMITTED' })
      ]);

      setLeaves(leaveData.data || []);
      setExpenses(expenseData.data || []);
      setTimesheets(timesheetData.data || []);
    } catch (error) {
      console.error('Error loading approvals:', error);
    }
  };

  const handleAction = async () => {
    try {
      if (activeTab === 'leaves') {
        if (actionType === 'approve') {
          await approveLeave(selectedItem._id);
        } else {
          await rejectLeave(selectedItem._id, 'Reason not provided');
        }
      } else if (activeTab === 'expenses') {
        if (actionType === 'approve') {
          await approveExpense(selectedItem._id);
        } else {
          await rejectExpense(selectedItem._id, 'Reason not provided');
        }
      } else {
        if (actionType === 'approve') {
          await approveTimesheet(selectedItem._id);
        } else {
          await rejectTimesheet(selectedItem._id, 'Reason not provided');
        }
      }
      
      await loadApprovals();
      setShowConfirm(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error processing approval:', error);
    }
  };

  const ApprovalItem = ({ item, type }: { item: any; type: string }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 hover:shadow-lg transition-all border-l-4 border-indigo-500">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            type === 'leaves' ? 'bg-orange-100 text-orange-600' :
            type === 'expenses' ? 'bg-yellow-100 text-yellow-600' :
            'bg-blue-100 text-blue-600'
          }`}>
            {type === 'leaves' && <CalendarDaysIcon className="w-5 h-5" />}
            {type === 'expenses' && <CreditCardIcon className="w-5 h-5" />}
            {type === 'timesheets' && <ClockIcon className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {item.employeeId?.name || 'Unknown'} - {type === 'leaves' ? item.leaveType : type === 'expenses' ? item.category : 'Weekly Timesheet'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {type === 'expenses' ? `₹${item.amount}` : type === 'leaves' ? `${item.duration} days` : `${item.hoursWorked} hours`}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
          Pending
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {item.reason || item.description || item.taskDescription}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedItem(item);
              setActionType('reject');
              setShowConfirm(true);
            }}
            className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors"
          >
            <XCircleIcon className="w-4 h-4 inline mr-1" />
            Reject
          </button>
          <button
            onClick={() => {
              setSelectedItem(item);
              setActionType('approve');
              setShowConfirm(true);
            }}
            className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4 inline mr-1" />
            Approve
          </button>
        </div>
      </div>
    </div>
  );

  const items = {
    leaves,
    expenses,
    timesheets
  }[activeTab];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <CheckCircleIcon className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Approvals</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review and approve employee requests ({items.length} pending)
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow mb-8 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('leaves')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'leaves'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Leaves ({leaves.length})
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'expenses'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('timesheets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'timesheets'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Timesheets ({timesheets.length})
            </button>
          </nav>
        </div>

        {/* Approval Items */}
        <div className="p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No pending {activeTab} requests
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                All {activeTab} requests have been processed
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <ApprovalItem key={item._id} item={item} type={activeTab} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedItem && (
        <ConfirmationModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleAction}
          title={`Confirm ${actionType}`}
          message={`Are you sure you want to ${actionType} this ${activeTab} request for ${selectedItem.employeeId?.name || 'user'}?`}
          actionType={actionType}
        />
      )}
    </div>
  );
};

export default Approvals;
