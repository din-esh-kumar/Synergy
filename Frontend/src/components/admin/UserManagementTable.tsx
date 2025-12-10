import { useEffect, useMemo, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import toast from 'react-hot-toast';

export default function UserManagementTable() {
  const {
    users,
    fetchAllUsers,
    updateUserRole,
    toggleUserStatus,
    updateUserAdmin,
    loading,
    updatingUserId,
    error,
    clearError
  } = useAdminStore();

  const [localLoading, setLocalLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Pagination calculations
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  // Memoize managers list for better performance
  const availableManagers = useMemo(() => {
    return users.filter(user => 
      ["manager", "admin"].includes(user.role) && 
      user.isActive
    );
  }, [users]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLocalLoading(userId);
    try {
      await updateUserRole(userId, newRole);
      toast.success('User role updated successfully!');
    } catch (error) {
      // console.error('Failed to update role:', error);
      toast.error('Failed to update user role.');
    } finally {
      setLocalLoading(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    setLocalLoading(userId);
    try {
      await toggleUserStatus(userId, !currentStatus);
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      // console.error('Failed to toggle status:', error);
      toast.error('Failed to update user status.');
    } finally {
      setLocalLoading(null);
    }
  };

  const handleManagerChange = async (userId: string, managerId: string | null) => {
    setLocalLoading(userId);
    try {
      await updateUserAdmin(userId, { managerId: managerId || null });
      toast.success('Manager assignment updated successfully!');
    } catch (error) {
      // console.error('Failed to update manager:', error);
      toast.error('Failed to update manager assignment.');
    } finally {
      setLocalLoading(null);
    }
  };

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">User Management</h2>
            <p className="text-gray-600 text-sm">Manage user roles, status, and manager assignments</p>
          </div>
          
          {/* Items per page selector */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
                Show:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">Loading users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <i className="fa-solid fa-users text-gray-400 text-2xl mb-2"></i>
                      <p>No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => {
                  const isLoading = localLoading === user.id || updatingUserId === user.id;
                  
                  return (
                    <tr 
                      key={user.id} 
                      className={`
                        hover:bg-gray-50
                        ${isLoading ? 'opacity-50' : ''}
                        ${!user.isActive ? 'bg-gray-100' : ''}
                      `}
                    >
                      {isLoading ? (
                        <td colSpan={5} className="px-4 py-4 text-center">
                          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Updating...
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-4 py-3 whitespace-nowrap">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              disabled={!user.isActive}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="employee">Employee</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          
                          <td className="px-4 py-3 whitespace-nowrap">
                            <select
                              value={user.managerId || ''}
                              onChange={e =>
                                handleManagerChange(
                                  user.id,
                                  e.target.value.length > 0 ? e.target.value : null
                                )
                              }
                              disabled={!user.isActive || user.role === 'admin'}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">Unassigned</option>
                              {availableManagers
                                .filter(mgr => mgr.id !== user.id)
                                .map((mgr) => (
                                  <option key={mgr.id} value={mgr.id}>
                                    {mgr.firstName} {mgr.lastName} ({mgr.role})
                                  </option>
                                ))}
                            </select>
                          </td>
                          
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          
                          <td className="px-4 py-3 text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleStatusToggle(user.id, user.isActive)}
                              disabled={isLoading}
                              className={`text-xs font-medium transition-colors ${
                                user.isActive
                                  ? "text-red-600 hover:text-red-800"
                                  : "text-green-600 hover:text-green-800"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {user.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {users.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, users.length)}</span> of{' '}
              <span className="font-medium">{users.length}</span> users
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <button
                onClick={goToPrevious}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex space-x-1">
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-2 py-1 text-xs border rounded transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}