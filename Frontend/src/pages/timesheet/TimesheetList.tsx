import React, { useEffect, useState, useMemo } from 'react';
import { useTimesheetStore } from '../../store/timesheetStore';
import TimesheetFormModal from '../../components/forms/TimesheetFormModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import type { Timesheet, User } from '../../types';
import RejectedReasonTooltip from '../../components/RejectedReasonTooltip';
import toast from 'react-hot-toast';
import apiClient from '../../config/api';

export default function TimesheetList() {
  const {
    timesheets,
    loading,
    error,
    fetchTimesheets,
    deleteTimesheet,
    submitTimesheet,
    clearError,
  } = useTimesheetStore();

  const { projects, fetchProjects } = useProjectStore();
  const { user } = useAuthStore();

  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Timesheet | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'submit' | null;
    itemId: string | null;
  }>({ isOpen: false, type: null, itemId: null });

  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });

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
    fetchTimesheets();
    fetchProjects();
    if (user?.role === 'admin' || user?.role === 'manager') {
      fetchEmployees();
    }
  }, []);

  // Determine which timesheets to show based on user role
  const timesheetsToShow = useMemo(() => {
    if (user?.role === 'admin') {
      return timesheets.filter(timesheet => timesheet.userId !== user.id);
    } else if (user?.role === 'manager') {
      const managedEmployeeIds = employees
        .filter(emp => emp.managerId === user.id)
        .map(emp => emp.id);
      
      return timesheets.filter(timesheet => 
        timesheet.userId === user.id || managedEmployeeIds.includes(timesheet.userId)
      );
    } else {
      return timesheets.filter(timesheet => timesheet.userId === user?.id);
    }
  }, [timesheets, user, employees]);

  const getProjectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.name || 'N/A';

  // Get employee name by ID
  const getEmployeeName = (userId: string) => {
    const employee = employees.find(emp => emp.id === userId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown User';
  };

  const filteredTimesheets = useMemo(
    () =>
      timesheetsToShow.filter((timesheet) => {
        const projectName = getProjectName(timesheet.projectId).toLowerCase();
        const description = timesheet.description?.toLowerCase() || '';
        const searchText = filters.search.toLowerCase();

        const matchesStatus =
          filters.status === 'all' || timesheet.status === filters.status;
        const matchesSearch =
          projectName.includes(searchText) || description.includes(searchText);

        return matchesStatus && matchesSearch;
      }),
    [timesheetsToShow, filters, projects]
  );

  // Pagination
  const totalPages = Math.ceil(filteredTimesheets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTimesheets = filteredTimesheets.slice(startIndex, startIndex + itemsPerPage);

  // Calculate empty rows to maintain consistent height
  const emptyRows = Math.max(0, itemsPerPage - paginatedTimesheets.length);

  const handleDelete = (id: string) =>
    setConfirmModal({ isOpen: true, type: 'delete', itemId: id });

  const handleSubmit = (id: string) =>
    setConfirmModal({ isOpen: true, type: 'submit', itemId: id });

  const handleConfirmAction = async () => {
    if (!confirmModal.itemId) return;

    setActionLoading(true);
    try {
      if (confirmModal.type === 'delete') {
        await deleteTimesheet(confirmModal.itemId);
        toast.success('Timesheet deleted successfully!');
      } else if (confirmModal.type === 'submit') {
        await submitTimesheet(confirmModal.itemId);
        toast.success('Timesheet submitted for approval!');
      }
      await fetchTimesheets();
      setConfirmModal({ isOpen: false, type: null, itemId: null });
    } catch (error) {
      // console.error('Action failed:', error);
      toast.error('Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (timesheet: Timesheet) => {
    setEditData(timesheet);
    setShowForm(true);
  };

  const handleCloseForm = async () => {
    setShowForm(false);
    setEditData(null);
    await fetchTimesheets();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const handleNewTimesheet = () => {
    setEditData(null);
    setShowForm(true);
  };

  // Update page title based on user role
  useEffect(() => {
    if (user?.role === 'admin') {
      document.title = 'All Timesheets - Timesheet Management';
    } else if (user?.role === 'manager') {
      document.title = 'Team Timesheets - Timesheet Management';
    } else {
      document.title = 'My Timesheets - Timesheet Management';
    }
  }, [user]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 truncate">
            {user?.role === 'admin' ? 'All Timesheets' : 
             user?.role === 'manager' ? 'Team Timesheets' : 'My Timesheets'}
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            {user?.role === 'admin' ? 'Manage all employee timesheets' : 
             user?.role === 'manager' ? 'Manage your team timesheets' : 'Track your work hours and project tasks'}
          </p>
        </div>
        <button
          onClick={handleNewTimesheet}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition shadow-md hover:shadow-lg flex-shrink-0"
        >
          <i className="fa-solid fa-plus"></i>
          <span>New Timesheet</span>
        </button>
      </div>

      {/* Filters - Smaller Size */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <i className="fa-solid fa-search absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by project or description..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
          Showing {filteredTimesheets.length} of {timesheetsToShow.length} timesheets
        </div>
      </div>

      {/* Timesheet Table with Fixed Height */}
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Hours</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Project</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Description</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Status</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && timesheets.length === 0 ? (
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
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
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
              ) : paginatedTimesheets.length === 0 && !loading ? (
                <tr className="h-12">
                  <td 
                    colSpan={user?.role === 'admin' || user?.role === 'manager' ? 8 : 7} 
                    className="text-center py-8 text-gray-500"
                  >
                    No timesheets found
                  </td>
                </tr>
              ) : (
                <>
                  {/* Actual data rows */}
                  {paginatedTimesheets.map((timesheet, index) => (
                    <tr key={timesheet.id} className="hover:bg-gray-50 transition h-12">
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {startIndex + index + 1}
                      </td>
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span className="truncate">{getEmployeeName(timesheet.userId)}</span>
                            {timesheet.userId === user?.id && (
                              <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded flex-shrink-0">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(timesheet.date)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-blue-600">{timesheet.hours}h</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 truncate" title={getProjectName(timesheet.projectId)}>
                        {getProjectName(timesheet.projectId)}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 truncate max-w-[200px]" title={timesheet.description}>
                        {timesheet.description || 'No description'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(timesheet.status)}`}>
                          {timesheet.status?.charAt(0).toUpperCase() + timesheet.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          {(timesheet.userId === user?.id || user?.role === 'admin' || user?.role === 'manager') && (
                            <>
                              {timesheet.status === 'draft' && (
                                <>
                                  <button onClick={() => handleEdit(timesheet)} className="text-blue-600 hover:text-blue-900" title="Edit timesheet">
                                    <i className="fa-solid fa-pen-to-square text-sm"></i>
                                  </button>
                                  <button onClick={() => handleSubmit(timesheet.id)} className="text-green-600 hover:text-green-900" title="Submit timesheet">
                                    <i className="fa-solid fa-paper-plane text-sm"></i>
                                  </button>
                                  <button onClick={() => handleDelete(timesheet.id)} className="text-red-600 hover:text-red-900" title="Delete timesheet">
                                    <i className="fa-solid fa-trash text-sm"></i>
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          {timesheet.status === 'submitted' && <span className="text-gray-400 text-xs italic">Pending</span>}
                          {timesheet.status === 'approved' && (
                            <span className="text-green-600 text-xs flex items-center">
                              <i className="fa-solid fa-check-circle mr-1"></i>Approved
                            </span>
                          )}
                          {timesheet.status === 'rejected' && (
                            <RejectedReasonTooltip reason={timesheet.rejectionReason ?? undefined} />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:flex-1 sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + itemsPerPage, filteredTimesheets.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredTimesheets.length}</span> results
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
                        className={`relative inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md ${
                          currentPage === pageNum
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

      {/* Timesheet Form Modal */}
      {showForm && (
        <TimesheetFormModal
          isOpen={showForm}
          onClose={handleCloseForm}
          editData={editData}
          employees={employees}
          currentUser={user}
          employeesLoading={employeesLoading}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null, itemId: null })}
        onConfirm={handleConfirmAction}
        title={confirmModal.type === 'delete' ? 'Delete Timesheet' : 'Submit Timesheet'}
        message={
          confirmModal.type === 'delete'
            ? 'Are you sure you want to delete this timesheet? This action cannot be undone.'
            : "Are you sure you want to submit this timesheet for approval? You won't be able to edit it after submission."
        }
        confirmText={confirmModal.type === 'delete' ? 'Delete' : 'Submit'}
        confirmColor={confirmModal.type === 'delete' ? 'red' : 'green'}
        loading={actionLoading}
      />
    </div>
  );
}








































































// // src/pages/timesheets/TimesheetList.tsx
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Plus, Search, Clock, Trash2, Edit, Eye } from 'lucide-react';
// import { useTimesheetStore } from '../../store/timesheetStore';
// import toast from 'react-hot-toast';

// const TimesheetList: React.FC = () => {
//   const navigate = useNavigate();
//   const { timesheets = [], deleteTimesheet } = useTimesheetStore();
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');

//   const filteredTimesheets = timesheets?.filter((ts) => {
//     const matchesSearch = ts?.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesStatus = filterStatus === 'all' || ts?.status === filterStatus;
//     return matchesSearch && matchesStatus;
//   }) || [];

//   const handleDelete = (id: string) => {
//     if (confirm('Delete this timesheet?')) {
//       deleteTimesheet(id);
//       toast.success('Timesheet deleted');
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     const colors: { [key: string]: string } = {
//       draft: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
//       submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
//       approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
//       rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
//     };
//     return colors[status] || colors.draft;
//   };

//   const totalHours = filteredTimesheets.reduce((sum, ts) => sum + (ts?.totalHours || 0), 0);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Timesheets</h1>
//           <p className="text-slate-600 dark:text-slate-400">Track and submit your work hours</p>
//         </div>
//         <button
//           onClick={() => navigate('/timesheets/new')}
//           className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
//         >
//           <Plus className="w-5 h-5" />
//           New Timesheet
//         </button>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-2">
//             <Clock className="w-4 h-4" />
//             Total Hours
//           </p>
//           <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalHours}</p>
//         </div>
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm">Submitted</p>
//           <p className="text-3xl font-bold text-blue-600 mt-2">
//             {timesheets?.filter((ts) => ts.status === 'submitted').length || 0}
//           </p>
//         </div>
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm">Approved</p>
//           <p className="text-3xl font-bold text-green-600 mt-2">
//             {timesheets?.filter((ts) => ts.status === 'approved').length || 0}
//           </p>
//         </div>
//       </div>

//       {/* Search & Filter */}
//       <div className="flex flex-col md:flex-row gap-4">
//         <div className="flex-1 relative">
//           <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//           <input
//             type="text"
//             placeholder="Search by project..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           />
//         </div>
//         <select
//           value={filterStatus}
//           onChange={(e) => setFilterStatus(e.target.value)}
//           className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//         >
//           <option value="all">All Status</option>
//           <option value="draft">Draft</option>
//           <option value="submitted">Submitted</option>
//           <option value="approved">Approved</option>
//           <option value="rejected">Rejected</option>
//         </select>
//       </div>

//       {/* Timesheets Table */}
//       <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
//         {filteredTimesheets.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Project
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Period
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Hours
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
//                 {filteredTimesheets.map((ts) => (
//                   <tr
//                     key={ts.id}
//                     className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
//                   >
//                     <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
//                       {ts.projectName}
//                     </td>
//                     <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
//                       {ts.startDate && new Date(ts.startDate).toLocaleDateString()}
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className="font-semibold text-slate-900 dark:text-white">
//                         {ts.totalHours}h
//                       </span>
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(ts.status)}`}>
//                         {ts.status}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="flex items-center gap-2">
//                         <button
//                           onClick={() => navigate(`/timesheets/${ts.id}`)}
//                           className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors"
//                           title="View"
//                         >
//                           <Eye className="w-4 h-4" />
//                         </button>
//                         {ts.status === 'draft' && (
//                           <>
//                             <button
//                               onClick={() => navigate(`/timesheets/${ts.id}/edit`)}
//                               className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded transition-colors"
//                               title="Edit"
//                             >
//                               <Edit className="w-4 h-4" />
//                             </button>
//                             <button
//                               onClick={() => handleDelete(ts.id)}
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
//             <p className="text-slate-600 dark:text-slate-400 mb-4">No timesheets found</p>
//             <button
//               onClick={() => navigate('/timesheets/new')}
//               className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
//             >
//               Create First Timesheet
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TimesheetList;