// src/services/approval.service.ts

import api from './api';

// These map directly to the :type param in /approvals/:type/:id/...
export type ApprovalEntityType = 'leave' | 'expense' | 'timesheet';

// For /approvals/pending
// Backend supports type: 'leaves' | 'expenses' | 'timesheets' | 'all'
export type PendingTypeFilter = 'leaves' | 'expenses' | 'timesheets' | 'all';

export interface PendingApprovalsFilters {
  type?: PendingTypeFilter;
}

/**
 * Fetch pending approvals for admin/manager dashboard.
 * GET /approvals/pending?type=leaves|expenses|timesheets|all
 */
export const getPendingApprovals = async (
  filters?: PendingApprovalsFilters,
) => {
  const response = await api.get('/approvals/pending', {
    params: filters,
  });
  return response.data;
};

/**
 * Approve a specific item.
 * PUT /approvals/:type/:id/approve
 * type = 'leave' | 'expense' | 'timesheet'
 */
export const approveItem = async (type: ApprovalEntityType, id: string) => {
  const response = await api.put(`/approvals/${type}/${id}/approve`);
  return response.data;
};

/**
 * Reject a specific item with reason.
 * PUT /approvals/:type/:id/reject
 */
export const rejectItem = async (
  type: ApprovalEntityType,
  id: string,
  rejectionReason: string,
) => {
  const response = await api.put(`/approvals/${type}/${id}/reject`, {
    rejectionReason,
  });
  return response.data;
};
