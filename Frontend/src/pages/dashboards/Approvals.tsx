import { useEffect, useState, useMemo } from 'react';
import { useApprovalStore } from '../../store/approvalStore';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useAuthStore } from '../../store/authStore';
import ReceiptModal from '../../components/ReceiptModal';
import toast from 'react-hot-toast';

const TableSkeleton = ({ columns = 6, rows = 5 }) => (
  <tbody>
    {[...Array(rows)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        {[...Array(columns)].map((__, j) => (
          <td key={j} className="px-4 py-4">
            <div className="h-4 bg-gray-200 rounded"></div>
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

const TABS = ['Timesheets', 'Expenses', 'Leaves'];

export default function ApprovalsPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState(0);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | null;
    entity: 'timesheet' | 'expense' | 'leave' | null;
    itemId: string | null;
  }>({ isOpen: false, type: null, entity: null, itemId: null });

  const [receiptModal, setReceiptModal] = useState<{ isOpen: boolean; imageUrl: string | null }>({
    isOpen: false,
    imageUrl: null,
  });

  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const {
    pendingTimesheets,
    pendingExpenses,
    pendingLeaves,
    users,
    projects,
    fetchAllPending,
    fetchUsers,
    fetchProjects,
    approveTimesheet,
    rejectTimesheet,
    approveExpense,
    rejectExpense,
    approveLeave,
    rejectLeave,
    removeTimesheet,
    removeExpense,
    removeLeave,
    loading,
    error,
    clearError,
  } = useApprovalStore();

  // ✅ Show toast when there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Redirect unauthorized users
  useEffect(() => {
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      window.location.href = '/';
    } else {
      fetchAllPending();
      fetchUsers();
      fetchProjects();
    }
  }, [user, fetchAllPending, fetchUsers, fetchProjects]);

  // ✅ Filter only submitted items
  const tableData = useMemo(() => {
    const filteredTimesheets = pendingTimesheets.filter((item) => item.status === 'submitted');
    const filteredExpenses = pendingExpenses.filter((item) => item.status === 'submitted');
    const filteredLeaves = pendingLeaves.filter((item) => item.status === 'submitted');
    return [filteredTimesheets, filteredExpenses, filteredLeaves][tab] || [];
  }, [pendingTimesheets, pendingExpenses, pendingLeaves, tab]);

  // ✅ Maintain local copy for instant UI updates
  const [localTableData, setLocalTableData] = useState<any[]>([]);
  useEffect(() => {
    setLocalTableData(tableData);
  }, [tableData]);

  const usersMap = useMemo(() => {
    return users.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {} as Record<string, typeof users[0]>);
  }, [users]);

  const projectsMap = useMemo(() => {
    return projects.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, typeof projects[0]>);
  }, [projects]);

  const columns = useMemo(() => {
    return [
      [
        {
          label: 'User',
          accessor: (item: any) => {
            const u = usersMap[item.userId || item.user?.id];
            return u ? (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3">
                  {u.firstName?.[0]}{u.lastName?.[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
              </div>
            ) : (
              <span className="text-gray-400">Loading...</span>
            );
          },
        },
        {
          label: 'Project',
          accessor: (item: any) => {
            const p = projectsMap[item.projectId || item.project?.id];
            return p ? (
              <span className="text-sm text-gray-900">{p.name}</span>
            ) : (
              <span className="text-gray-400">Loading...</span>
            );
          },
        },
        { 
          label: 'Date', 
          accessor: (item: any) => (
            <span className="text-sm text-gray-900">
              {new Date(item.date).toLocaleDateString()}
            </span>
          )
        },
        { 
          label: 'Hours', 
          accessor: (item: any) => (
            <span className="text-sm font-medium text-gray-900">{item.hours}</span>
          )
        },
        { 
          label: 'Description', 
          accessor: (item: any) => (
            <span className="text-sm text-gray-600 line-clamp-2">{item.description || '-'}</span>
          )
        },
      ],
      [
        {
          label: 'User',
          accessor: (item: any) => {
            const u = usersMap[item.userId || item.user?.id];
            return u ? (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3">
                  {u.firstName?.[0]}{u.lastName?.[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
              </div>
            ) : (
              <span className="text-gray-400">Loading...</span>
            );
          },
        },
        { 
          label: 'Amount', 
          accessor: (item: any) => (
            <span className="text-sm font-medium text-green-600">
              ${parseFloat(item.amount).toFixed(2)}
            </span>
          )
        },
        { 
          label: 'Description', 
          accessor: (item: any) => (
            <span className="text-sm text-gray-600 line-clamp-2">{item.description || '-'}</span>
          )
        },
        {
          label: 'Receipt',
          accessor: (item: any) =>
            item.receiptUrl ? (
              <button
                onClick={() => setReceiptModal({ isOpen: true, imageUrl: item.receiptUrl })}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              >
                <i className="fa-solid fa-receipt mr-1"></i>
                View Receipt
              </button>
            ) : (
              <span className="text-gray-400 text-sm italic">No receipt</span>
            ),
        },
      ],
      [
        {
          label: 'User',
          accessor: (item: any) => {
            const u = usersMap[item.userId || item.user?.id];
            return u ? (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3">
                  {u.firstName?.[0]}{u.lastName?.[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
              </div>
            ) : (
              <span className="text-gray-400">Loading...</span>
            );
          },
        },
        { 
          label: 'Type', 
          accessor: (item: any) => (
            <span className="text-sm font-medium text-gray-900 capitalize">
              {item.leaveType?.name || '-'}
            </span>
          )
        },
        { 
          label: 'From', 
          accessor: (item: any) => (
            <span className="text-sm text-gray-900">
              {new Date(item.startDate).toLocaleDateString()}
            </span>
          )
        },
        { 
          label: 'To', 
          accessor: (item: any) => (
            <span className="text-sm text-gray-900">
              {new Date(item.endDate).toLocaleDateString()}
            </span>
          )
        },
        { 
          label: 'Reason', 
          accessor: (item: any) => (
            <span className="text-sm text-gray-600 line-clamp-2">{item.reason || '-'}</span>
          )
        },
      ],
    ][tab];
  }, [tab, usersMap, projectsMap]);

  const handleApprove = (id: string, entity: 'timesheet' | 'expense' | 'leave') =>
    setConfirmModal({ isOpen: true, type: 'approve', entity, itemId: id });

  const handleReject = (id: string, entity: 'timesheet' | 'expense' | 'leave') => {
    setRejectReason('');
    setConfirmModal({ isOpen: true, type: 'reject', entity, itemId: id });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.itemId || !confirmModal.entity) return;
    setActionLoading(true);
    setActionInProgress(confirmModal.itemId);

    try {
      const id = confirmModal.itemId;
      const entity = confirmModal.entity;

      if (confirmModal.type === 'approve') {
        if (entity === 'timesheet') await approveTimesheet(id);
        if (entity === 'expense') await approveExpense(id);
        if (entity === 'leave') await approveLeave(id);

        toast.success(`${entity.charAt(0).toUpperCase() + entity.slice(1)} approved successfully!`);
      } else if (confirmModal.type === 'reject') {
        if (!rejectReason.trim()) {
          toast.error('Please provide a reason before rejecting.');
          return;
        }
        if (entity === 'timesheet') await rejectTimesheet(id, rejectReason.trim());
        if (entity === 'expense') await rejectExpense(id, rejectReason.trim());
        if (entity === 'leave') await rejectLeave(id, rejectReason.trim());

        toast.success(`${entity.charAt(0).toUpperCase() + entity.slice(1)} rejected successfully.`);
      }

      // ✅ Instantly remove from UI and store
      setLocalTableData((prev) => prev.filter((item) => item.id !== id && item._id !== id));

      if (entity === 'timesheet') removeTimesheet(id);
      if (entity === 'expense') removeExpense(id);
      if (entity === 'leave') removeLeave(id);

      setConfirmModal({ isOpen: false, type: null, entity: null, itemId: null });
      setRejectReason('');
    } catch (err) {
      // console.error('Approval action failed:', err);
      toast.error('Something went wrong while processing the action.');
    } finally {
      setActionLoading(false);
      setActionInProgress(null);
    }
  };

  const getTotalPending = () => {
    return tableData.length;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Approvals</h2>
            <p className="text-gray-600 text-sm">
              Review and approve pending {TABS[tab].toLowerCase()} from your team
              {getTotalPending() > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {getTotalPending()} pending
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex space-x-1">
          {TABS.map((t, i) => (
            <button
              key={t}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm border ${
                tab === i
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
              onClick={() => setTab(i)}
            >
              {t}
              {i === 0 && pendingTimesheets.filter(item => item.status === 'submitted').length > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingTimesheets.filter(item => item.status === 'submitted').length}
                </span>
              )}
              {i === 1 && pendingExpenses.filter(item => item.status === 'submitted').length > 0 && (
                <span className="ml-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingExpenses.filter(item => item.status === 'submitted').length}
                </span>
              )}
              {i === 2 && pendingLeaves.filter(item => item.status === 'submitted').length > 0 && (
                <span className="ml-2 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingLeaves.filter(item => item.status === 'submitted').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.label}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton columns={columns.length + 1} rows={8} />
            ) : (
              <tbody className="bg-white divide-y divide-gray-200">
                {localTableData.map((item) => {
                  const isLoading = actionInProgress === (item.id || item._id);
                  
                  return (
                    <tr 
                      key={item.id || item._id} 
                      className={`hover:bg-gray-50 transition-all duration-200 ${
                        isLoading ? 'opacity-50' : ''
                      }`}
                    >
                      {columns.map((col) => (
                        <td key={col.label} className="px-4 py-4">
                          {col.accessor(item)}
                        </td>
                      ))}
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {isLoading ? (
                          <div className="inline-flex items-center gap-2 text-gray-500">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <button
                              className="text-green-600 hover:text-green-900 transition text-xs font-medium bg-green-50 px-2 py-1 rounded"
                              onClick={() =>
                                handleApprove(
                                  item.id || item._id,
                                  ['timesheet', 'expense', 'leave'][tab] as
                                    | 'timesheet'
                                    | 'expense'
                                    | 'leave'
                                )
                              }
                            >
                              <i className="fa-solid fa-check mr-1"></i>
                              Approve
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900 transition text-xs font-medium bg-red-50 px-2 py-1 rounded"
                              onClick={() =>
                                handleReject(
                                  item.id || item._id,
                                  ['timesheet', 'expense', 'leave'][tab] as
                                    | 'timesheet'
                                    | 'expense'
                                    | 'leave'
                                )
                              }
                            >
                              <i className="fa-solid fa-xmark mr-1"></i>
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {localTableData.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="text-center py-12 text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <i className="fa-solid fa-check-circle text-gray-400 text-3xl mb-3"></i>
                        <p className="text-lg font-medium text-gray-600">All caught up!</p>
                        <p className="text-sm text-gray-500 mt-1">
                          No pending {TABS[tab].toLowerCase()} require your approval.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      <ReceiptModal
        isOpen={receiptModal.isOpen}
        imageUrl={receiptModal.imageUrl}
        onClose={() => setReceiptModal({ isOpen: false, imageUrl: null })}
      />

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => {
          setConfirmModal({ isOpen: false, type: null, entity: null, itemId: null });
          setRejectReason('');
        }}
        onConfirm={handleConfirmAction}
        title={
          confirmModal.entity
            ? `${confirmModal.type === 'approve' ? 'Approve' : 'Reject'} ${
                confirmModal.entity[0].toUpperCase() + confirmModal.entity.slice(1)
              }`
            : ''
        }
        message={
          confirmModal.type === 'approve'
            ? `Are you sure you want to approve this ${confirmModal.entity}?`
            : `Are you sure you want to reject this ${confirmModal.entity}?`
        }
        confirmText={confirmModal.type === 'approve' ? 'Approve' : 'Reject'}
        confirmColor={confirmModal.type === 'reject' ? 'red' : 'green'}
        loading={actionLoading}
        showReasonInput={confirmModal.type === 'reject'}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        disableConfirm={confirmModal.type === 'reject' && !rejectReason.trim()}
      />
    </div>
  );
}













// // src/pages/approvals/Approvals.tsx
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Check, X, Eye, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
// import { useApprovalStore } from '../../store/approvalStore';
// import toast from 'react-hot-toast';

// const Approvals: React.FC = () => {
//   const navigate = useNavigate();
//   const { approvals = [], updateApprovalStatus } = useApprovalStore();
//   const [filterType, setFilterType] = useState('all');
//   const [filterStatus, setFilterStatus] = useState('pending');

//   const filteredApprovals = approvals?.filter((approval) => {
//     const matchesType = filterType === 'all' || approval?.type === filterType;
//     const matchesStatus = filterStatus === 'all' || approval?.status === filterStatus;
//     return matchesType && matchesStatus;
//   }) || [];

//   const handleApprove = (id: string) => {
//     updateApprovalStatus(id, 'approved');
//     toast.success('Approved successfully');
//   };

//   const handleReject = (id: string) => {
//     updateApprovalStatus(id, 'rejected');
//     toast.error('Rejected successfully');
//   };

//   const getTypeColor = (type: string) => {
//     const colors: { [key: string]: string } = {
//       timesheet: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
//       expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
//       leave: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
//       other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
//     };
//     return colors[type] || colors.other;
//   };

//   const getTypeIcon = (type: string) => {
//     const icons: { [key: string]: React.ReactNode } = {
//       timesheet: <Clock className="w-4 h-4" />,
//       expense: <AlertCircle className="w-4 h-4" />,
//       leave: <CheckCircle2 className="w-4 h-4" />,
//     };
//     return icons[type];
//   };

//   const pendingCount = approvals?.filter((a) => a.status === 'pending').length || 0;
//   const approvedCount = approvals?.filter((a) => a.status === 'approved').length || 0;

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Approvals</h1>
//         <p className="text-slate-600 dark:text-slate-400 mt-2">
//           Review and approve team requests
//         </p>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm">Pending</p>
//           <p className="text-3xl font-bold text-orange-600 mt-2">{pendingCount}</p>
//         </div>
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm">Approved</p>
//           <p className="text-3xl font-bold text-green-600 mt-2">{approvedCount}</p>
//         </div>
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm">Total</p>
//           <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
//             {approvals?.length || 0}
//           </p>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="flex flex-col md:flex-row gap-4">
//         <select
//           value={filterType}
//           onChange={(e) => setFilterType(e.target.value)}
//           className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//         >
//           <option value="all">All Types</option>
//           <option value="timesheet">Timesheet</option>
//           <option value="expense">Expense</option>
//           <option value="leave">Leave</option>
//         </select>
//         <select
//           value={filterStatus}
//           onChange={(e) => setFilterStatus(e.target.value)}
//           className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//         >
//           <option value="all">All Status</option>
//           <option value="pending">Pending</option>
//           <option value="approved">Approved</option>
//           <option value="rejected">Rejected</option>
//         </select>
//       </div>

//       {/* Approvals List */}
//       <div className="space-y-4">
//         {filteredApprovals.length > 0 ? (
//           filteredApprovals.map((approval) => (
//             <div
//               key={approval.id}
//               className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-md transition-all"
//             >
//               <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-3 mb-3">
//                     <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(approval.type)}`}>
//                       {getTypeIcon(approval.type)}
//                       {approval.type}
//                     </span>
//                     <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                       approval.status === 'pending'
//                         ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
//                         : approval.status === 'approved'
//                         ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
//                         : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
//                     }`}>
//                       {approval.status}
//                     </span>
//                   </div>

//                   <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
//                     {approval.title}
//                   </h3>
//                   <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
//                     {approval.description}
//                   </p>
//                   <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
//                     <span>From: {approval.submittedBy}</span>
//                     <span>Submitted: {new Date(approval.submittedDate).toLocaleDateString()}</span>
//                     {approval.amount && <span>Amount: ₹{approval.amount.toFixed(2)}</span>}
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => navigate(`/approvals/${approval.id}`)}
//                     className="p-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
//                     title="View Details"
//                   >
//                     <Eye className="w-5 h-5" />
//                   </button>
//                   {approval.status === 'pending' && (
//                     <>
//                       <button
//                         onClick={() => handleApprove(approval.id)}
//                         className="p-3 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg transition-colors"
//                         title="Approve"
//                       >
//                         <Check className="w-5 h-5" />
//                       </button>
//                       <button
//                         onClick={() => handleReject(approval.id)}
//                         className="p-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
//                         title="Reject"
//                       >
//                         <X className="w-5 h-5" />
//                       </button>
//                     </>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))
//         ) : (
//           <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
//             <p className="text-slate-600 dark:text-slate-400">
//               {filterStatus === 'pending' ? 'No pending approvals' : 'No approvals found'}
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Approvals;