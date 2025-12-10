import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import toast from 'react-hot-toast';

interface LeaveTypeFormData {
  name: string;
  code: string;
  description: string;
  maxDays: number;
  hasDefaultBalance: boolean;
  isActive: boolean;
}

export default function LeaveTypesManagementTable() {
  const { leaveTypes, loadingLeaveData, fetchLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType } = useAdminStore();
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [formData, setFormData] = useState<LeaveTypeFormData>({
    name: '',
    code: '',
    description: '',
    maxDays: 0,
    isActive: true,
    hasDefaultBalance: true
  });

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType) {
        await updateLeaveType(editingType.id, formData);
        toast.success('Leave type updated successfully');
      } else {
        await createLeaveType(formData);
        toast.success('Leave type created successfully');
      }
      resetForm();
    } catch (error) {
      // Error handled by store
    }
  };

  const handleEdit = (type: any) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      code: type.code,
      description: type.description || '',
      maxDays: type.maxDays,
      isActive: type.isActive,
      hasDefaultBalance: type.hasDefaultBalance ?? true
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this leave type?')) {
      try {
        await deleteLeaveType(id);
        toast.success('Leave type deleted successfully');
      } catch (error) {
        // Error handled by store
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingType(null);
    setFormData({ 
      name: '', 
      code: '', 
      description: '', 
      maxDays: 0, 
      isActive: true, 
      hasDefaultBalance: true 
    });
  };

  // Handle background click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      resetForm();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Leave Types</h2>
            <p className="text-gray-600 text-sm">Manage different types of leaves available</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
          >
            Add Leave Type
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Days</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Balance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingLeaveData ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">Loading leave types...</p>
                  </td>
                </tr>
              ) : leaveTypes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <i className="fa-solid fa-inbox text-gray-400 text-2xl mb-2"></i>
                      <p>No leave types found</p>
                      <button
                        onClick={() => setShowForm(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                      >
                        Create your first leave type
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                leaveTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{type.name}</div>
                      {type.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{type.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">{type.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {type.maxDays === 0 ? (
                        <span className="text-gray-400">Unlimited</span>
                      ) : (
                        <span className="font-medium">{type.maxDays} days</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          type.hasDefaultBalance
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {type.hasDefaultBalance ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          type.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {type.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(type)}
                        className="text-blue-600 hover:text-blue-900 transition text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="text-red-600 hover:text-red-900 transition text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup Form Modal */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingType ? 'Edit Leave Type' : 'Create New Leave Type'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., Sick Leave"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., SL"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Days *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.maxDays}
                    onChange={(e) => setFormData({ ...formData, maxDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="0 for unlimited"
                  />
                  <p className="text-xs text-gray-500 mt-1">Set to 0 for unlimited days</p>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasDefaultBalance}
                    onChange={(e) => setFormData({ ...formData, hasDefaultBalance: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Include in Default Balances
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Active</label>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
                  >
                    {editingType ? 'Update' : 'Create'} Leave Type
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