import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function LeaveApplicationsOverview() {
  const { 
    allLeaveApplications, 
    loadingLeaveData, 
    fetchAllLeaveApplications, 
    approveLeave, 
    rejectLeave 
  } = useAdminStore();

  const { user: currentUser } = useAuthStore();
  
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [rejectionReasons, setRejectionReasons] = useState<{[key: string]: string}>({});
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // console.log('Fetching leave applications with status:', selectedStatus);
    fetchAllLeaveApplications({ status: selectedStatus === 'all' ? undefined : selectedStatus });
  }, [fetchAllLeaveApplications, selectedStatus]);

  useEffect(() => {
    // console.log('Current leave applications:', allLeaveApplications);
  }, [allLeaveApplications]);

  // Pagination calculations
  const totalPages = Math.ceil(allLeaveApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = allLeaveApplications.slice(startIndex, endIndex);

  const handleApprove = async (id: string) => {
    if (window.confirm('Are you sure you want to approve this leave application?')) {
      try {
        await approveLeave(id);
        toast.success('Leave application approved successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to approve leave');
      }
    }
  };

  const handleReject = async (id: string) => {
    const reason = rejectionReasons[id];
    if (!reason || reason.trim() === '') {
      toast.error('Please provide a rejection reason');
      return;
    }

    if (window.confirm('Are you sure you want to reject this leave application?')) {
      try {
        await rejectLeave(id, reason);
        toast.success('Leave application rejected successfully');
        setShowRejectForm(null);
        setRejectionReasons(prev => ({ ...prev, [id]: '' }));
      } catch (error: any) {
        toast.error(error.message || 'Failed to reject leave');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: {[key: string]: { class: string; text: string }} = {
      draft: { class: 'bg-gray-100 text-gray-800', text: 'Draft' },
      submitted: { class: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      approved: { class: 'bg-green-100 text-green-800', text: 'Approved' },
      rejected: { class: 'bg-red-100 text-red-800', text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysBetween = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const Pagination = () => (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
        <span className="font-medium">{Math.min(endIndex, allLeaveApplications.length)}</span> of{' '}
        <span className="font-medium">{allLeaveApplications.length}</span> results
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Leave Applications</h2>
            <p className="text-gray-600 text-sm">Review and manage all employee leave requests</p>
            <p className="text-xs text-gray-500 mt-1">
              Debug: {allLeaveApplications.length} applications loaded
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingLeaveData ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">Loading leave applications...</p>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <i className="fa-solid fa-clipboard-list text-gray-400 text-2xl mb-2"></i>
                      <p>No leave applications found</p>
                      <p className="text-sm mt-1">Status: {selectedStatus}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Check if there are any leave applications in the system
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {application.user?.firstName} {application.user?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{application.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {application.leaveType?.name || 'Unknown Type'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="whitespace-nowrap">{formatDate(application.startDate)} - {formatDate(application.endDate)}</div>
                      <div className="text-xs text-gray-500">
                        {getDaysBetween(application.startDate, application.endDate)} days
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(application.status)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {application.status === 'submitted' && application.userId !== currentUser?.id && (
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprove(application.id)}
                              className="text-green-600 hover:text-green-900 transition text-xs font-medium bg-green-50 px-2 py-1 rounded"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setShowRejectForm(showRejectForm === application.id ? null : application.id)}
                              className="text-red-600 hover:text-red-900 transition text-xs font-medium bg-red-50 px-2 py-1 rounded"
                            >
                              Reject
                            </button>
                          </div>
                          {showRejectForm === application.id && (
                            <div className="p-2 bg-red-50 rounded-md border border-red-200">
                              <textarea
                                placeholder="Enter rejection reason..."
                                value={rejectionReasons[application.id] || ''}
                                onChange={(e) => setRejectionReasons(prev => ({
                                  ...prev,
                                  [application.id]: e.target.value
                                }))}
                                className="w-full px-2 py-1 text-sm border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                                rows={2}
                              />
                              <div className="flex space-x-2 mt-1">
                                <button
                                  onClick={() => handleReject(application.id)}
                                  className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                                >
                                  Confirm Reject
                                </button>
                                <button
                                  onClick={() => {
                                    setShowRejectForm(null);
                                    setRejectionReasons(prev => ({ ...prev, [application.id]: '' }));
                                  }}
                                  className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {application.status === 'submitted' && application.userId === currentUser?.id && (
                        <span className="text-gray-400 text-xs">Your own application</span>
                      )}
                      {application.status !== 'submitted' && (
                        <span className="text-gray-400 text-xs">No actions available</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {allLeaveApplications.length > 0 && <Pagination />}
    </div>
  );
}