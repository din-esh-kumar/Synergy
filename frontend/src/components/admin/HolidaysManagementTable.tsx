// src/components/admin/HolidaysManagementTable.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import api from '../../services/api';

interface Holiday {
  _id?: string;
  name: string;
  date: string;          // stored as YYYY-MM-DD in DB
  description?: string;
  isRecurring: boolean;
}

interface HolidaysApiResponse {
  success: boolean;
  message?: string;
  data?: Holiday[];
}

const DEFAULT_FORM: Holiday = {
  name: '',
  date: '',
  description: '',
  isRecurring: true,
};

const currentYearDefault = new Date().getFullYear();

const HolidaysManagementTable: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [formData, setFormData] = useState<Holiday>(DEFAULT_FORM);
  const [saving, setSaving] = useState<boolean>(false);
  const [filterYear, setFilterYear] = useState<number>(currentYearDefault);

  // --- helpers ----------------------------------------------------------------

  const normalizeDateToYMD = (value: string): string => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (value: string): string => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  // --- load -------------------------------------------------------------------

  useEffect(() => {
    void fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await api.get<HolidaysApiResponse>('/leaves/admin/holidays');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setHolidays(list);
    } catch (err) {
      console.error('Error fetching holidays:', err);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  // --- add / edit -------------------------------------------------------------

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      ...DEFAULT_FORM,
      date: `${filterYear}-01-01`,
    });
  };

  const startEdit = (holiday: Holiday) => {
    setIsAdding(false);
    setEditingId(holiday._id || null);
    setFormData({
      _id: holiday._id,
      name: holiday.name,
      date: normalizeDateToYMD(holiday.date),
      description: holiday.description || '',
      isRecurring: holiday.isRecurring ?? true,
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(DEFAULT_FORM);
    setSaving(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Holiday name is required.');
      return;
    }
    const normalizedDate = normalizeDateToYMD(formData.date);
    if (!normalizedDate) {
      alert('Valid date is required.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name.trim(),
        date: normalizedDate,
        description: formData.description?.trim() || '',
        isRecurring: !!formData.isRecurring,
      };

      if (editingId) {
        await api.put(`/leaves/admin/holidays/${editingId}`, payload);
      } else {
        await api.post('/leaves/admin/holidays', payload);
      }

      await fetchHolidays();
      handleCancel();
    } catch (err) {
      console.error('Error saving holiday:', err);
      alert('Error saving holiday. Please check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      await api.delete(`/leaves/admin/holidays/${id}`);
      await fetchHolidays();
    } catch (err) {
      console.error('Error deleting holiday:', err);
      alert('Error deleting holiday.');
    }
  };

  // --- filtering + sorting ----------------------------------------------------

  const filteredAndSorted = useMemo(() => {
    const listForYear = holidays.filter((h) => {
      const d = new Date(h.date);
      if (Number.isNaN(d.getTime())) return false;
      return d.getFullYear() === filterYear;
    });

    return listForYear.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return da - db;
    });
  }, [holidays, filterYear]);

  const yearOptions = useMemo(() => {
    const base = currentYearDefault;
    return [base - 1, base, base + 1, base + 2];
  }, []);

  // --- render -----------------------------------------------------------------

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Holidays
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Manage company holidays and recurring events
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Debug: {filteredAndSorted.length} holidays loaded for {filterYear}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Filter Year:
              </span>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={startAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Holiday
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                Type
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
            {/* Add row */}
            {isAdding && (
              <tr className="bg-blue-50 dark:bg-blue-900/20">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Holiday Name"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="date"
                    value={normalizeDateToYMD(formData.date)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date: normalizeDateToYMD(e.target.value),
                      })
                    }
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </td>
                <td className="px-6 py-4">
<select
  value={formData.isRecurring ? 'recurring' : 'non-recurring'}
  onChange={(e) =>
    setFormData({
      ...formData,
      isRecurring: e.target.value === 'recurring',
    })
  }
  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
>
  <option value="recurring">Recurring (same date every year)</option>
  <option value="non-recurring">Non‑Recurring (date varies by year)</option>
</select>

                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
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

            {/* Existing rows */}
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    <p className="text-slate-500 dark:text-slate-400">
                      Loading holidays...
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredAndSorted.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  No holidays configured for {filterYear}
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((holiday) => {
                const isEditing = editingId === holiday._id;

                return (
                  <tr
                    key={holiday._id}
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
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {holiday.name}
                          </div>
                          {holiday.description && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {holiday.description}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="date"
                          value={normalizeDateToYMD(formData.date)}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              date: normalizeDateToYMD(e.target.value),
                            })
                          }
                          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">
                          {formatDateForDisplay(holiday.date)}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
  {isEditing ? (
    <select
      value={formData.isRecurring ? 'recurring' : 'non-recurring'}
      onChange={(e) =>
        setFormData({
          ...formData,
          isRecurring: e.target.value === 'recurring',
        })
      }
      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
    >
      <option value="recurring">Recurring (same date every year)</option>
      <option value="non-recurring">Non‑Recurring (date varies by year)</option>
    </select>
  ) : (
    <span
      className={
        holiday.isRecurring
          ? 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
          : 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
      }
    >
      {holiday.isRecurring ? 'Recurring' : 'Non‑Recurring'}
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
                          {holiday.description || '-'}
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
                            onClick={() => startEdit(holiday)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(holiday._id)}
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

export default HolidaysManagementTable;
