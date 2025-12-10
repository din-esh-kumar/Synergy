import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface BalanceUpdateFormData {
  userId: string;
  leaveTypeId: string;
  balance: number;
  year: number;
}

export default function LeaveBalancesManagementTable() {
  const { 
    leaveBalances, 
    users, 
    leaveTypes, 
    loadingLeaveData, 
    fetchLeaveBalances, 
    updateLeaveBalance,
    fetchAllUsers,
    fetchLeaveTypes,
    initializeUserLeaveBalances,
    initializeAllUsersLeaveBalances
  } = useAdminStore();

  const { user: currentUser } = useAuthStore();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState<BalanceUpdateFormData>({
    userId: '',
    leaveTypeId: '',
    balance: 0,
    year: new Date().getFullYear()
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [selectedUserForInit, setSelectedUserForInit] = useState<string>('');
  const [initializing, setInitializing] = useState(false);
  const itemsPerPage = 8;

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    try {
      setDebugInfo('Loading data...');
      await Promise.all([
        fetchLeaveBalances({ year: selectedYear }),
        fetchAllUsers(),
        fetchLeaveTypes()
      ]);
      setDebugInfo(`Loaded: ${leaveBalances.length} balances, ${users.length} users, ${leaveTypes.length} leave types`);
    } catch (error: any) {
      setDebugInfo(`Error: ${error.message}`);
      toast.error('Failed to load data');
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(leaveBalances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = leaveBalances.slice(startIndex, endIndex);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateLeaveBalance(formData);
      toast.success('Leave balance updated successfully');
      setShowForm(false);
      setFormData({ userId: '', leaveTypeId: '', balance: 0, year: selectedYear });
      setCurrentPage(1);
      loadData(); // Reload data
    } catch (error: any) {
      toast.error(error.message || 'Failed to update leave balance');
    }
  };

  const handleInitializeAllBalances = async () => {
    if (window.confirm('This will initialize default leave balances for ALL active users. This may take a few moments. Continue?')) {
      setInitializing(true);
      try {
        const result = await initializeAllUsersLeaveBalances(selectedYear);
        toast.success(`Success! Created ${result.totalCreated} balances for ${result.totalUsers} users`);
        loadData(); // Reload data
      } catch (error: any) {
        toast.error(error.message || 'Failed to initialize all balances');
      } finally {
        setInitializing(false);
      }
    }
  };

  const handleInitializeSelectedUser = async () => {
    if (!selectedUserForInit) {
      toast.error('Please select a user first');
      return;
    }

    const userName = users.find(u => u.id === selectedUserForInit)?.firstName || 'the user';
    
    if (window.confirm(`Initialize default leave balances for ${userName}?`)) {
      setInitializing(true);
      try {
        await initializeUserLeaveBalances(selectedUserForInit, selectedYear);
        loadData(); // Reload data
      } catch (error: any) {
        toast.error(error.message || 'Failed to initialize user balances');
      } finally {
        setInitializing(false);
      }
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : `User (${userId})`;
  };

  const getLeaveTypeName = (leaveTypeId: string) => {
    const leaveType = leaveTypes.find(lt => lt.id === leaveTypeId);
    return leaveType ? leaveType.name : `Type (${leaveTypeId})`;
  };

  const resetForm = () => {
    setFormData({ 
      userId: '', 
      leaveTypeId: '', 
      balance: 0, 
      year: selectedYear 
    });
    setShowForm(false);
  };

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i - 1);

  const Pagination = () => (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
        <span className="font-medium">{Math.min(endIndex, leaveBalances.length)}</span> of{' '}
        <span className="font-medium">{leaveBalances.length}</span> results
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
        <div className="flex flex-col gap-4">
          {/* Title and Debug Info */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Leave Balances</h2>
              <p className="text-gray-600 text-sm">Manage employee leave balances</p>
              <p className="text-xs text-gray-500 mt-1">
                {debugInfo || `Status: ${leaveBalances.length} balances, ${users.length} users, ${leaveTypes.length} leave types`}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Year Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            {/* User Selection */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Select User:</label>
              <select
                value={selectedUserForInit}
                onChange={(e) => setSelectedUserForInit(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[200px]"
                disabled={users.length === 0}
              >
                <option value="">Choose user to initialize</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
                disabled={initializing}
              >
                Update Balance
              </button>
              <button
                onClick={handleInitializeSelectedUser}
                disabled={!selectedUserForInit || initializing}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {initializing ? 'Initializing...' : 'Init Selected User'}
              </button>
              <button
                onClick={handleInitializeAllBalances}
                disabled={initializing || users.length === 0}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {initializing ? 'Initializing All...' : 'Init All Users'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingLeaveData ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">Loading leave balances...</p>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <i className="fa-solid fa-scale-balanced text-gray-400 text-2xl mb-2"></i>
                      <p className="text-lg font-medium">No leave balances found</p>
                      <p className="text-sm mt-2 text-gray-600">
                        {users.length === 0 
                          ? 'No users found in the system' 
                          : leaveTypes.length === 0 
                          ? 'No leave types configured' 
                          : `No leave balances found for ${selectedYear}`
                        }
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        {users.length > 0 && leaveTypes.length > 0 && (
                          <>
                            <button
                              onClick={handleInitializeAllBalances}
                              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition text-sm font-medium"
                            >
                              Initialize All Users
                            </button>
                            <button
                              onClick={() => setShowForm(true)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
                            >
                              Add Balance Manually
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((balance) => (
                  <tr key={balance.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {getUserName(balance.userId)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {getLeaveTypeName(balance.leaveTypeId)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`font-semibold ${
                        balance.balance > 10 ? 'text-green-600' : 
                        balance.balance > 5 ? 'text-blue-600' : 
                        balance.balance > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {balance.balance} days
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {balance.year}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {leaveBalances.length > 0 && <Pagination />}

      {/* Popup Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Update Leave Balance</h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User *</label>
                  <select
                    required
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select User</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
                  <select
                    required
                    value={formData.leaveTypeId}
                    onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Balance *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.5"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter days"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                  <select
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Update Balance
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}