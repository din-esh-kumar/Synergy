// src/components/admin/LeaveBalancesManagementTable.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Edit2, Save, X, RefreshCw } from 'lucide-react';
import api from '../../services/api';

interface LeaveBalanceUser {
  _id: string;
  name: string;
  email: string;
}

interface LeaveBalanceType {
  _id: string;
  name: string;
  color?: string;
}

interface LeaveBalance {
  _id: string;
  userId: LeaveBalanceUser | string;
  leaveTypeId: LeaveBalanceType | string;
  year: number;
  balance: number;
}

interface LeaveBalanceRow {
  _id: string;
  user: LeaveBalanceUser;
  leaveType: LeaveBalanceType;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

interface GroupedUserBalances {
  user: LeaveBalanceUser;
  balances: LeaveBalanceRow[];
}

const CURRENT_YEAR = new Date().getFullYear();

const LeaveBalancesManagementTable: React.FC = () => {
  const [balances, setBalances] = useState<LeaveBalanceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [year, setYear] = useState<number>(CURRENT_YEAR);

  const fetchBalances = async (y: number) => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: LeaveBalance[] }>(
        '/leaves/admin/balances',
        { params: { year: y } },
      );

      const raw = response.data?.data || [];

      // Normalize and filter out any malformed rows so we never access undefined._id
      const mapped: LeaveBalanceRow[] = raw
        .map((b) => {
          const user =
            typeof b.userId === 'string'
              ? null
              : (b.userId as LeaveBalanceUser | null);
          const leaveType =
            typeof b.leaveTypeId === 'string'
              ? null
              : (b.leaveTypeId as LeaveBalanceType | null);

          if (!user?._id || !leaveType?._id) {
            return null;
          }

          return {
            _id: b._id,
            user,
            leaveType,
            totalDays: b.balance,
            usedDays: 0,
            remainingDays: b.balance,
          } as LeaveBalanceRow;
        })
        .filter((row): row is LeaveBalanceRow => row !== null);

      setBalances(mapped);
    } catch (error) {
      console.error('Error fetching balances:', error);
      setBalances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBalances(year);
  }, [year]);

  const handleEdit = (row: LeaveBalanceRow) => {
    setEditingId(row._id);
    setEditValue(row.totalDays);
  };

  const handleSave = async (row: LeaveBalanceRow) => {
    try {
      await api.put(`/leaves/admin/balances/${row._id}`, {
        balance: Math.max(0, editValue || 0),
      });
      await fetchBalances(year);
      setEditingId(null);
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue(0);
  };

  const handleInitAll = async () => {
    if (
      !window.confirm(
        `Initialize balances for all users for ${year}? Existing rows will be preserved/updated.`,
      )
    ) {
      return;
    }

    try {
      await api.post('/leaves/admin/balances/initialize-all', { year });
      await fetchBalances(year);
    } catch (error) {
      console.error('Error initializing all balances:', error);
    }
  };

  // Group balances by user for rowSpan UI, with guards
  const groupedBalances: Record<string, GroupedUserBalances> = useMemo(
    () =>
      balances.reduce((acc, balance) => {
        if (!balance?.user?._id) {
          return acc;
        }
        const userId = balance.user._id;

        if (!acc[userId]) {
          acc[userId] = {
            user: balance.user,
            balances: [],
          };
        }
        acc[userId].balances.push(balance);
        return acc;
      }, {} as Record<string, GroupedUserBalances>),
    [balances],
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredUsers = useMemo(
    () =>
      Object.values(groupedBalances).filter(({ user }) => {
        if (!normalizedSearch) return true;
        const name = user?.name?.toLowerCase?.() || '';
        const email = user?.email?.toLowerCase?.() || '';
        return (
          name.includes(normalizedSearch) || email.includes(normalizedSearch)
        );
      }),
    [groupedBalances, normalizedSearch],
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Leave Balances Management
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Manage employee leave balances and allocations
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={year}
              onChange={(e) => {
                setEditingId(null);
                setYear(Number(e.target.value));
              }}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setEditingId(null);
              }}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleInitAll}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Init All Users
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
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                Leave Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                Total Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                Used Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                Remaining
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    <p className="text-slate-500 dark:text-slate-400">
                      Loading balances...
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  {normalizedSearch
                    ? 'No employees found'
                    : 'No leave balances available'}
                </td>
              </tr>
            ) : (
              filteredUsers.map(({ user, balances: userBalances }) =>
                userBalances.map((balance, index) => {
                  const isEditing = editingId === balance._id;

                  return (
                    <tr
                      key={balance._id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      {index === 0 && (
                        <td
                          className="px-6 py-4"
                          rowSpan={userBalances.length}
                        >
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {user.email}
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {balance.leaveType.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: balance.leaveType.color,
                              }}
                            />
                          )}
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {balance.leaveType.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) =>
                              setEditValue(Number(e.target.value) || 0)
                            }
                            className="w-20 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            min={0}
                          />
                        ) : (
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {balance.totalDays} days
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {balance.usedDays} days
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            balance.remainingDays > 5
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : balance.remainingDays > 0
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {balance.remainingDays} days
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSave(balance)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(balance)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveBalancesManagementTable;
