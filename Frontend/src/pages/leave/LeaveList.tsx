import { useEffect, useState, useMemo } from 'react';
import { useLeaveStore } from '../../store/leaveStore';
import LeaveFormModal from '../../components/forms/LeaveFormModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useAuthStore } from '../../store/authStore';
import type { Leave, User } from '../../types';
import RejectedReasonTooltip from '../../components/RejectedReasonTooltip';
import toast from 'react-hot-toast';
import apiClient from '../../config/api';

export default function LeaveList() {
  const {
    leaves,
    leaveTypes,
    loading,
    initialLoading,
    error,
    fetchLeaves,
    fetchLeaveTypes,
    deleteLeave,
    submitLeave,
    approveLeave,
    rejectLeave,
    clearError,
  } = useLeaveStore();

  const { user: currentUser } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Leave | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'submit' | 'approve' | 'reject' | null;
    itemId: string | null;
    itemData?: any;
  }>({ isOpen: false, type: null, itemId: null });

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [leaveToReject, setLeaveToReject] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });

  // Enhanced employee fetching with debugging
  const fetchEmployees = async () => {
    if (!currentUser) return;

    setEmployeesLoading(true);
    try {
      // // console.log('🔄 Fetching employees for role:', currentUser.role);

      const response = await apiClient.get('/api/user');
      const usersData = response.data?.data || response.data || [];

      // // console.log('✅ Raw API response:', response.data);
      // // console.log('📊 Users data:', usersData);

      let filteredEmployees: User[] = [];

      if (currentUser.role === 'admin') {
        // Admin can see all users
        filteredEmployees = usersData;
        // // console.log('👨‍💼 Admin - all employees:', filteredEmployees.length);
      } else if (currentUser.role === 'manager') {
        // Manager can see themselves and their team members
        filteredEmployees = usersData.filter((emp: User) =>
          emp.managerId === currentUser.id || emp.id === currentUser.id
        );
        // // console.log('👨‍💼 Manager - team employees:', filteredEmployees.length);
      } else {
        // Employee can only see themselves
        filteredEmployees = [currentUser];
        // // console.log('👤 Employee - only self:', filteredEmployees.length);
      }

      setEmployees(filteredEmployees);

      // Debug: Log all filtered employees
      // // console.log('📝 Final employee list:');
      filteredEmployees.forEach(emp => {
        // // console.log(`  - ID: ${emp.id}, Name: ${emp.firstName} ${emp.lastName}, ManagerID: ${emp.managerId}`);
      });

    } catch (err: any) {
      // // console.error('❌ Employee fetch error:', err);
      // // console.error('❌ Error details:', err.response?.data);
      toast.error('Failed to load employees');
      setEmployees([currentUser]); // Fallback to current user only
    } finally {
      setEmployeesLoading(false);
    }
  };

  // Enhanced employee name resolution with detailed debugging
  const getEmployeeName = (userId: string): string => {
  if (!userId) {
    return 'Unknown User';
  }

  // First check if it's the current user
  if (userId === currentUser?.id) {
    return `${currentUser.firstName} ${currentUser.lastName} (You)`;
  }

  // Then check the employees list
  const employee = employees.find(emp => emp.id === userId);

  if (employee) {
    return `${employee.firstName} ${employee.lastName}`;
  }

  // If not found, check if the leave data already has user info
  const leaveWithUser = leaves.find(l => l.userId === userId && l.user);
  if (leaveWithUser?.user) {
    return `${leaveWithUser.user.firstName} ${leaveWithUser.user.lastName}`;
  }

  // If still not found and we're still loading, show loading state
  if (employeesLoading) {
    return 'Loading...';
  }

  return 'Unknown User';
};

  useEffect(() => {
    const initializeData = async () => {
      // // console.log('🚀 Initializing leave data...');

      // Fetch employees first for admin/manager
      if (currentUser?.role === 'admin' || currentUser?.role === 'manager') {
        await fetchEmployees();
      } else if (currentUser) {
        // For employees, just set themselves
        setEmployees([currentUser]);
      }

      // Then fetch leaves and leave types
      await Promise.all([fetchLeaves(), fetchLeaveTypes()]);

      // Debug leaves data
      if (leaves.length > 0) {
        // // console.log('📋 Leaves data:', leaves.map(l => ({
        //   id: l.id,
        //   userId: l.userId,
        //   status: l.status
        // })));
      }
    };

    if (currentUser) {
      initializeData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Determine which leaves to show based on user role
  const leavesToShow = useMemo(() => {
    if (!currentUser) return [];

    // console.log('🎯 Filtering leaves for role:', currentUser.role);
    // console.log('📊 Total leaves:', leaves.length);

    let filteredLeaves: Leave[] = [];

    if (currentUser.role === 'admin') {
      // Admin sees all leaves except their own
      filteredLeaves = leaves.filter(leave => leave.userId !== currentUser.id);
      // console.log('👨‍💼 Admin leaves count:', filteredLeaves.length);
    } else if (currentUser.role === 'manager') {
      // Manager sees their own leaves + their team's leaves
      const managedEmployeeIds = employees
        .filter(emp => emp.managerId === currentUser.id)
        .map(emp => emp.id);

      filteredLeaves = leaves.filter(leave =>
        leave.userId === currentUser.id || managedEmployeeIds.includes(leave.userId)
      );
      // console.log('👨‍💼 Manager leaves count:', filteredLeaves.length);
      // console.log('👥 Managed employee IDs:', managedEmployeeIds);
    } else {
      // Regular user sees only their own leaves
      filteredLeaves = leaves.filter(leave => leave.userId === currentUser.id);
      // console.log('👤 Employee leaves count:', filteredLeaves.length);
    }

    return filteredLeaves;
  }, [leaves, currentUser, employees]);

  const filteredLeaves = useMemo(() => {
    return leavesToShow.filter((leave) => {
      const reason = leave.reason?.toLowerCase() || '';
      const typeMatch = filters.type === 'all' || leave.leaveTypeId === filters.type;
      const statusMatch = filters.status === 'all' || leave.status === filters.status;
      const searchMatch = reason.includes(filters.search.toLowerCase());
      return typeMatch && statusMatch && searchMatch;
    });
  }, [leavesToShow, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeaves = filteredLeaves.slice(startIndex, startIndex + itemsPerPage);
  const emptyRows = Math.max(0, itemsPerPage - paginatedLeaves.length);

  // Get leave type name by ID
  const getLeaveTypeName = (leaveTypeId: string) => {
    const leaveType = leaveTypes.find(lt => lt.id === leaveTypeId);
    return leaveType ? leaveType.name : 'Unknown Type';
  };

  const handleDelete = (id: string) => {
    setConfirmModal({ isOpen: true, type: 'delete', itemId: id });
  };

  const handleSubmit = (id: string) => {
    setConfirmModal({ isOpen: true, type: 'submit', itemId: id });
  };

  const handleApprove = (id: string) => {
    setConfirmModal({ isOpen: true, type: 'approve', itemId: id });
  };

  const handleReject = (id: string) => {
    setLeaveToReject(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!leaveToReject || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    const toastId = toast.loading('Rejecting leave…');
    setActionLoading(true);
    try {
      await rejectLeave(leaveToReject, rejectReason);
      toast.success('Leave rejected successfully!', { id: toastId });
      await fetchLeaves();
      setShowRejectModal(false);
      setLeaveToReject(null);
      setRejectReason('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reject leave';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (leave: Leave) => {
    setEditData(leave);
    setShowForm(true);
  };

  const handleCloseForm = async () => {
    setShowForm(false);
    setEditData(null);
    await fetchLeaves();
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.itemId) return;

    const actionMap = {
      delete: { text: 'Deleting leave…', success: 'Leave deleted successfully!' },
      submit: { text: 'Submitting leave…', success: 'Leave submitted successfully!' },
      approve: { text: 'Approving leave…', success: 'Leave approved successfully!' },
    };

    const action = actionMap[confirmModal.type as keyof typeof actionMap];
    const toastId = toast.loading(action.text);

    setActionLoading(true);
    try {
      switch (confirmModal.type) {
        case 'delete':
          await deleteLeave(confirmModal.itemId);
          break;
        case 'submit':
          await submitLeave(confirmModal.itemId);
          break;
        case 'approve':
          await approveLeave(confirmModal.itemId);
          break;
      }

      toast.success(action.success, { id: toastId });
      await fetchLeaves();
      setConfirmModal({ isOpen: false, type: null, itemId: null });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Action failed. Please try again.';
      // console.error('Action failed:', error);
      toast.error(errorMessage, { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      submitted: 'bg-yellow-100 text-yellow-800',
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

  // Check if user can perform actions on a leave
  const canPerformAction = (leave: Leave) => {
    if (!currentUser) return false;

    // Users can always act on their own leaves
    if (leave.userId === currentUser.id) return true;

    // Admins and managers can act on team leaves
    if (currentUser.role === 'admin' || currentUser.role === 'manager') {
      if (currentUser.role === 'manager') {
        const managedEmployeeIds = employees
          .filter(emp => emp.managerId === currentUser.id)
          .map(emp => emp.id);
        return managedEmployeeIds.includes(leave.userId);
      }
      return true;
    }

    return false;
  };

  // // Check if user can approve/reject a leave
  // const canApproveReject = (leave: Leave) => {
  //   if (!currentUser) return false;
  //   return (currentUser.role === 'admin' || currentUser.role === 'manager') && leave.status === 'submitted';
  // };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-blue-600 mb-4"></i>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 truncate">
            {currentUser.role === 'admin' ? 'All Leaves' :
              currentUser.role === 'manager' ? 'Team Leaves' : 'My Leaves'}
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            {currentUser.role === 'admin' ? 'Manage all employee leaves' :
              currentUser.role === 'manager' ? 'Manage your team leaves' : 'Apply, manage & track your time off'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition shadow-md hover:shadow-lg flex-shrink-0"
        >
          <i className="fa-solid fa-plus"></i>
          <span>New Leave</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <i className="fa-solid fa-search absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by reason..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {leaveTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

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
          Showing {filteredLeaves.length} of {leavesToShow.length} leaves
          {employeesLoading && ' • Loading employees...'}
        </div>
      </div>

      {/* Leave Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full divide-y divide-gray-200 min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  #
                </th>
                {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Employee
                  </th>
                )}
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">From</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">To</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Reason</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Status</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && leaves.length === 0 ? (
                // Skeleton Rows
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse h-12">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-6"></div>
                    </td>
                    {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
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
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded max-w-xs"></div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right">
                      <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedLeaves.length === 0 && !loading ? (
                <tr className="h-12">
                  <td
                    colSpan={currentUser.role === 'admin' || currentUser.role === 'manager' ? 8 : 7}
                    className="text-center py-8 text-gray-500"
                  >
                    {leavesToShow.length === 0 ? 'No leaves found.' : 'No leaves match your filters.'}
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedLeaves.map((leave, index) => (
                    <tr key={leave.id} className="hover:bg-gray-50 transition h-12">
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {startIndex + index + 1}
                      </td>
                      {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center space-x-2">
                            {employeesLoading ? (
                              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                            ) : (
                              <>
                                <span className="truncate">{getEmployeeName(leave.userId)}</span>
                                {/* Debug info - remove after fixing */}
                                
                                {leave.userId === currentUser.id && (
                                  <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded flex-shrink-0">
                                    You
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        {getLeaveTypeName(leave.leaveTypeId)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">{formatDate(leave.startDate)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">{formatDate(leave.endDate)}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 truncate max-w-[200px]" title={leave.reason}>
                        {leave.reason || 'N/A'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                          {leave.status?.charAt(0).toUpperCase() + leave.status?.slice(1) || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          {canPerformAction(leave) && leave.status === 'draft' && (
                            <>
                              <button
                                onClick={() => handleEdit(leave)}
                                className="text-blue-600 hover:text-blue-900 transition"
                                title="Edit leave"
                              >
                                <i className="fa-solid fa-pen-to-square text-sm"></i>
                              </button>
                              <button
                                onClick={() => handleSubmit(leave.id)}
                                className="text-green-600 hover:text-green-900 transition"
                                title="Submit for approval"
                              >
                                <i className="fa-solid fa-paper-plane text-sm"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(leave.id)}
                                className="text-red-600 hover:text-red-900 transition"
                                title="Delete leave"
                              >
                                <i className="fa-solid fa-trash text-sm"></i>
                              </button>
                            </>
                          )}

                          

                          {leave.status === 'submitted'  && (
                            <span className="text-gray-400 text-xs italic">Pending approval</span>
                          )}
                          {leave.status === 'approved' && (
                            <span className="text-green-600 text-xs flex items-center">
                              <i className="fa-solid fa-check-circle mr-1"></i>Approved
                            </span>
                          )}
                          {leave.status === 'rejected' && (
                            <RejectedReasonTooltip reason={leave.rejectionReason ?? undefined} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {emptyRows > 0 && Array.from({ length: emptyRows }).map((_, index) => (
                    <tr key={`empty-${index}`} className="h-12 border-b border-gray-200">
                      <td colSpan={currentUser.role === 'admin' || currentUser.role === 'manager' ? 8 : 7} className="px-3 py-3"></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:flex-1 sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + itemsPerPage, filteredLeaves.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredLeaves.length}</span> results
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
        <LeaveFormModal
          isOpen={showForm}
          onClose={handleCloseForm}
          editData={editData}
          employees={employees}
          currentUser={currentUser}
          employeesLoading={employeesLoading}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null, itemId: null })}
        onConfirm={handleConfirmAction}
        title={
          confirmModal.type === 'delete' ? 'Delete Leave' :
            confirmModal.type === 'submit' ? 'Submit Leave' :
              confirmModal.type === 'approve' ? 'Approve Leave' : ''
        }
        message={
          confirmModal.type === 'delete'
            ? 'Are you sure you want to delete this leave? This action cannot be undone.'
            : confirmModal.type === 'submit'
              ? 'Are you sure you want to submit this leave for approval?'
              : confirmModal.type === 'approve'
                ? 'Are you sure you want to approve this leave?'
                : ''
        }
        confirmText={
          confirmModal.type === 'delete' ? 'Delete' :
            confirmModal.type === 'submit' ? 'Submit' :
              confirmModal.type === 'approve' ? 'Approve' : ''
        }
        confirmColor={
          confirmModal.type === 'delete' ? 'red' :
            confirmModal.type === 'submit' ? 'green' :
              confirmModal.type === 'approve' ? 'green' : 'blue'
        }
        loading={actionLoading}
      />

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Reject Leave</h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Please provide a reason for rejecting this leave..."
              />
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-5 py-2 text-gray-600 hover:text-gray-800 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Leave'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}














































// // src/pages/leaves/LeaveList.tsx
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Plus, Calendar, Trash2, Edit, Eye } from 'lucide-react';
// import { useLeaveStore } from '../../store/leaveStore';
// import toast from 'react-hot-toast';

// const LeaveList: React.FC = () => {
//   const navigate = useNavigate();
//   const { leaves = [], deleteLeave } = useLeaveStore();
//   const [filterStatus, setFilterStatus] = useState('all');

//   const filteredLeaves = leaves?.filter((leave) => {
//     return filterStatus === 'all' || leave?.status === filterStatus;
//   }) || [];

//   const handleDelete = (id: string) => {
//     if (confirm('Delete this leave request?')) {
//       deleteLeave(id);
//       toast.success('Leave request deleted');
//     }
//   };

//   const getStatusColor = (status: string) => {
//     const colors: { [key: string]: string } = {
//       pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
//       approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
//       rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
//       cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
//     };
//     return colors[status] || colors.pending;
//   };

//   const getLeaveTypeColor = (type: string) => {
//     const colors: { [key: string]: string } = {
//       sick: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
//       casual: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
//       earned: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
//       unpaid: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
//     };
//     return colors[type] || colors.casual;
//   };

//   const approvedDays = filteredLeaves
//     .filter((leave) => leave.status === 'approved')
//     .reduce((sum, leave) => sum + (leave?.days || 0), 0);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Leaves</h1>
//           <p className="text-slate-600 dark:text-slate-400">Manage your leave requests</p>
//         </div>
//         <button
//           onClick={() => navigate('/leaves/new')}
//           className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
//         >
//           <Plus className="w-5 h-5" />
//           Request Leave
//         </button>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm">Total Requests</p>
//           <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
//             {leaves?.length || 0}
//           </p>
//         </div>
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm">Pending</p>
//           <p className="text-3xl font-bold text-orange-600 mt-2">
//             {leaves?.filter((l) => l.status === 'pending').length || 0}
//           </p>
//         </div>
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-2">
//             <Calendar className="w-4 h-4" />
//             Approved Days
//           </p>
//           <p className="text-3xl font-bold text-green-600 mt-2">{approvedDays}</p>
//         </div>
//       </div>

//       {/* Filter */}
//       <div className="flex gap-4">
//         <select
//           value={filterStatus}
//           onChange={(e) => setFilterStatus(e.target.value)}
//           className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//         >
//           <option value="all">All Status</option>
//           <option value="pending">Pending</option>
//           <option value="approved">Approved</option>
//           <option value="rejected">Rejected</option>
//           <option value="cancelled">Cancelled</option>
//         </select>
//       </div>

//       {/* Leaves Table */}
//       <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
//         {filteredLeaves.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Type
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Duration
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Days
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Reason
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
//                 {filteredLeaves.map((leave) => (
//                   <tr
//                     key={leave.id}
//                     className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
//                   >
//                     <td className="px-6 py-4">
//                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLeaveTypeColor(leave.leaveType)}`}>
//                         {leave.leaveType}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
//                       {leave.startDate && new Date(leave.startDate).toLocaleDateString()} -{' '}
//                       {leave.endDate && new Date(leave.endDate).toLocaleDateString()}
//                     </td>
//                     <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
//                       {leave.days} days
//                     </td>
//                     <td className="px-6 py-4">
//                       <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
//                         {leave.reason}
//                       </p>
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(leave.status)}`}>
//                         {leave.status}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="flex items-center gap-2">
//                         <button
//                           onClick={() => navigate(`/leaves/${leave.id}`)}
//                           className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors"
//                           title="View"
//                         >
//                           <Eye className="w-4 h-4" />
//                         </button>
//                         {leave.status === 'pending' && (
//                           <>
//                             <button
//                               onClick={() => navigate(`/leaves/${leave.id}/edit`)}
//                               className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded transition-colors"
//                               title="Edit"
//                             >
//                               <Edit className="w-4 h-4" />
//                             </button>
//                             <button
//                               onClick={() => handleDelete(leave.id)}
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
//             <p className="text-slate-600 dark:text-slate-400 mb-4">No leave requests found</p>
//             <button
//               onClick={() => navigate('/leaves/new')}
//               className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
//             >
//               Request Leave
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default LeaveList;