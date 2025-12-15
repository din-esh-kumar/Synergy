// src/services/export.service.ts
import api from './api';

export interface ExportFilters {
  userId?: string;
  projectId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export async function exportTimesheets(filters: ExportFilters) {
  const res = await api.get('/api/export/timesheets', {
    params: {
      userId: filters.userId || undefined,
      projectId: filters.projectId || undefined,
      status: filters.status || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    },
  });
  return res.data;
}

export async function exportExpenses(filters: ExportFilters) {
  const res = await api.get('/api/export/expenses', {
    params: {
      userId: filters.userId || undefined,
      status: filters.status || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    },
  });
  return res.data;
}

export async function exportLeaves(filters: ExportFilters) {
  const res = await api.get('/api/export/leaves', {
    params: {
      userId: filters.userId || undefined,
      status: filters.status || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    },
  });
  return res.data;
}
