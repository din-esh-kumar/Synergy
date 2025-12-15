// src/components/admin/LeaveTypesManagementTable.tsx
import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import api from '../../services/api';

interface LeaveType {
  _id?: string;
  name: string;
  code: string;
  maxDays: number;        // backend field used as "Default Days"
  description: string;
}

interface LeaveTypesApiResponse {
  success: boolean;
  message?: string;
  data?: LeaveType[];
}

const DEFAULT_FORM: LeaveType = {
  name: '',
  code: '',
  maxDays: 0,
  description: '',
};

const LeaveTypesManagementTable: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [formData, setFormData] = useState<LeaveType>(DEFAULT_FORM);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    void fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const response = await api.get<LeaveTypesApiResponse>(
        '/leaves/admin/leave-types',
      );
      const types = Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      setLeaveTypes(types);
    } catch (error) {
      console.error('Error fetching leave types:', error);
      setLeaveTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (leaveType: LeaveType) => {
    setIsAdding(false);
    setEditingId(leaveType._id || null);
    setFormData({
      _id: leaveType._id,
      name: leaveType.name,
      code: leaveType.code,
      maxDays: leaveType.maxDays,
      description: leaveType.description,
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Leave type name is required.');
      return;
    }

    if (!formData.code.trim()) {
      alert('Leave type code is required.');
      return;
    }

    if (formData.maxDays < 0) {
      alert('Default days cannot be negative.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        maxDays: formData.maxDays,
        description: formData.description.trim(),
      };

      if (editingId) {
        await api.put(`/leaves/admin/leave-types/${editingId}`, payload);
      } else {
        await api.post('/leaves/admin/leave-types', payload);
      }

      await fetchLeaveTypes();
      handleCancel();
    } catch (error) {
      console.error('Error saving leave type:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this leave type?')) {
      return;
    }

    try {
      await api.delete(`/leaves/admin/leave-types/${id}`);
      await fetchLeaveTypes();
    } catch (error) {
      console.error('Error deleting leave type:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData(DEFAULT_FORM);
    setSaving(false);
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData(DEFAULT_FORM);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Leave Types Management
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Configure available leave types and default allocations
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Leave Type
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                Leave Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                Default Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {/* Add New Row */}
            {isAdding && (
              <tr className="bg-blue-50 dark:bg-blue-900/20">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Leave Type Name"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="Code (e.g. SL, AL)"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    min={0}
                    value={formData.maxDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDays: Number(e.target.value),
                      })
                    }
                    className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Description"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Existing Leave Types */}
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    <p className="text-slate-500 dark:text-slate-400">
                      Loading...
                    </p>
                  </div>
                </td>
              </tr>
            ) : leaveTypes.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  No leave types configured
                </td>
              </tr>
            ) : (
              leaveTypes.map((leaveType) => {
                const isEditing = editingId === leaveType._id;

                return (
                  <tr
                    key={leaveType._id}
                    className={
                      isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : undefined
                    }
                  >
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      ) : (
                        <span className="font-medium text-slate-900 dark:text-white">
                          {leaveType.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              code: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">
                          {leaveType.code}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={formData.maxDays}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxDays: Number(e.target.value),
                            })
                          }
                          className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      ) : (
                        <span className="text-slate-707 dark:text-slate-300">
                          {leaveType.maxDays} days
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400">
                          {leaveType.description}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(leaveType)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(leaveType._id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveTypesManagementTable;
