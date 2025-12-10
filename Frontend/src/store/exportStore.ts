import { create } from 'zustand';
import apiClient from '../config/api';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { ExportFilters, Timesheet, Expense, Leave } from '../types';

interface ExportState {
  loading: boolean;
  error: string | null;
  exportTimesheets: (filters: ExportFilters) => Promise<void>;
  exportExpenses: (filters: ExportFilters) => Promise<void>;
  exportLeaves: (filters: ExportFilters) => Promise<void>;
  clearError: () => void;
}

export const useExportStore = create<ExportState>((set) => ({
  loading: false,
  error: null,

  exportTimesheets: async (filters: ExportFilters) => {
    try {
      set({ loading: true, error: null });
      const params = new URLSearchParams();
      if (filters.employeeId) params.append('userId', filters.employeeId);
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);

      const tsRes = await apiClient.get<{ data: Timesheet[] }>(
        `/api/export/timesheets?${params.toString()}`
      );
      const timesheets = tsRes.data.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Timesheets');

      worksheet.columns = [
        { header: 'Employee ID', key: 'userId', width: 36 },
        { header: 'Employee Name', key: 'employeeName', width: 24 },
        { header: 'Employee Email', key: 'userEmail', width: 28 },
        { header: 'Project Name', key: 'projectName', width: 22 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Hours', key: 'hours', width: 9 },
        { header: 'Status', key: 'status', width: 13 },
        { header: 'Approver/Rejecter Name Name', key: 'approverName', width: 24 },
        { header: 'Approval/Rejection Date ', key: 'approvedAt', width: 22 },
      ];

      timesheets.forEach((ts) => {
        worksheet.addRow(ts);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `timesheets_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to export timesheets', loading: false });
    }
  },

  exportExpenses: async (filters: ExportFilters) => {
    try {
      set({ loading: true, error: null });
      const params = new URLSearchParams();
      if (filters.employeeId) params.append('userId', filters.employeeId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);

      const expRes = await apiClient.get<{ data: Expense[] }>(
        `/api/export/expenses?${params.toString()}`
      );
      const expenses = expRes.data.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Expenses');

      worksheet.columns = [
        { header: 'Employee ID', key: 'userId', width: 36 },
        { header: 'Employee Name', key: 'employeeName', width: 24 },
        { header: 'Employee Email', key: 'userEmail', width: 28 },
        { header: 'Amount', key: 'amount', width: 11 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Approver/Rejecter Name', key: 'approverName', width: 24 },
        { header: 'Approval/Rejection Date ', key: 'approvedAt', width: 20 },
        { header: 'Receipt Provided', key: 'receiptProvided', width: 15 },
      ];

      expenses.forEach((exp) => {
        worksheet.addRow({
          ...exp,
          receiptProvided:
            exp.receiptUrl && exp.receiptUrl.startsWith('data:image') ? 'Yes' : 'No',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `expenses_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to export expenses', loading: false });
    }
  },

  exportLeaves: async (filters: ExportFilters) => {
    try {
      set({ loading: true, error: null });
      const params = new URLSearchParams();
      if (filters.employeeId) params.append('userId', filters.employeeId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);

      const leaveRes = await apiClient.get<{ data: Leave[] }>(
        `/api/export/leaves?${params.toString()}`
      );
      const leaves = leaveRes.data.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Leaves');

      worksheet.columns = [
        { header: 'Employee ID', key: 'userId', width: 36 },
        { header: 'Employee Name', key: 'employeeName', width: 25 },
        { header: 'Employee Email', key: 'userEmail', width: 30 },
        { header: 'Leave Type', key: 'leaveTypeName', width: 13 },
        { header: 'Start Date', key: 'startDate', width: 15 },
        { header: 'End Date', key: 'endDate', width: 15 },
        { header: 'Duration (Days)', key: 'duration', width: 13 },
        { header: 'Status', key: 'status', width: 13 },
        { header: 'Approver/Rejecter Name', key: 'approverName', width: 24 },
        { header: 'Approval/Rejection Date ', key: 'approvedAt', width: 20 },
      ];

      // // console.log('Leaves to export:', leaves);

      leaves.forEach((leave) => {
        worksheet.addRow({
          ...leave,
          duration:
            leave.startDate && leave.endDate
              ? Math.ceil(
                (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) /
                (1000 * 3600 * 24)
              ) + 1
              : undefined,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `leaves_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to export leaves', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
