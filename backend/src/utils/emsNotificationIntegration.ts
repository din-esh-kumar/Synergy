// src/utils/emsNotificationIntegration.ts
import mongoose from 'mongoose';
import { createNotification } from './notificationEngine';

/**
 * 🔍 Validate ObjectId safely (shared utility)
 */
const validateObjectId = (id: any): string | null => {
  if (!id) return null;
  
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id).toString();
    }
  } catch (error) {
    return null;
  }
  return null;
};

export async function notifyLeaveRequest(args: {
  approverId: string;
  employeeName: string;
  leaveType: string;
  duration: number;
  leaveId: string;
}) {
  const { approverId, employeeName, leaveType, duration, leaveId } = args;

  // ✅ Validate approverId before notification
  const validApproverId = validateObjectId(approverId);
  if (!validApproverId) {
    console.warn('❌ Invalid approverId for leave request:', approverId);
    return;
  }

  await createNotification({
    userId: validApproverId,
    type: 'system',
    action: 'created',
    title: 'Leave Request',
    message: `${employeeName} requested ${duration} day(s) of ${leaveType} leave`,
    entityType: 'leave',
    entityId: leaveId,
    icon: 'calendar',
    color: '#3b82f6',
    actionUrl: `/approvals?tab=leaves&id=${leaveId}`,
  });
}

export async function notifyLeaveDecision(args: {
  employeeId: string;
  employeeName: string;
  status: 'approved' | 'rejected';
  leaveType: string;
  duration: number;
  approverName: string;
  leaveId: string;
}) {
  const {
    employeeId,
    status,
    leaveType,
    duration,
    approverName,
    leaveId,
  } = args;

  // ✅ Validate employeeId before notification
  const validEmployeeId = validateObjectId(employeeId);
  if (!validEmployeeId) {
    console.warn('❌ Invalid employeeId for leave decision:', employeeId);
    return;
  }

  const approved = status === 'approved';

  await createNotification({
    userId: validEmployeeId,
    type: 'system',
    action: approved ? 'completed' : 'deleted',
    title: approved ? 'Leave Approved' : 'Leave Rejected',
    message: approved
      ? `Your ${leaveType} leave (${duration} day(s)) was approved by ${approverName}`
      : `Your ${leaveType} leave (${duration} day(s)) was rejected by ${approverName}`,
    entityType: 'leave',
    entityId: leaveId,
    icon: approved ? 'check-circle' : 'x-circle',
    color: approved ? '#10b981' : '#ef4444',
    actionUrl: `/leaves/${leaveId}`,
  });
}

export async function notifyExpenseRequest(args: {
  approverId: string;
  employeeName: string;
  amount: number;
  expenseId: string;
}) {
  const { approverId, employeeName, amount, expenseId } = args;

  // ✅ Validate approverId before notification
  const validApproverId = validateObjectId(approverId);
  if (!validApproverId) {
    console.warn('❌ Invalid approverId for expense request:', approverId);
    return;
  }

  await createNotification({
    userId: validApproverId,
    type: 'system',
    action: 'created',
    title: 'Expense Request',
    message: `${employeeName} submitted an expense request of ₹${amount}`,
    entityType: 'expense',
    entityId: expenseId,
    icon: 'receipt',
    color: '#f97316',
    actionUrl: `/approvals?tab=expenses&id=${expenseId}`,
  });
}

export async function notifyTimesheetSubmission(args: {
  approverId: string;
  employeeName: string;
  periodLabel: string;
  timesheetId: string;
}) {
  const {
    approverId,
    employeeName,
    periodLabel,
    timesheetId,
  } = args;

  // ✅ Validate approverId before notification
  const validApproverId = validateObjectId(approverId);
  if (!validApproverId) {
    console.warn('❌ Invalid approverId for timesheet submission:', approverId);
    return;
  }

  await createNotification({
    userId: validApproverId,
    type: 'system',
    action: 'created',
    title: 'Timesheet Submitted',
    message: `${employeeName} submitted a timesheet for ${periodLabel}`,
    entityType: 'timesheet',
    entityId: timesheetId,
    icon: 'clock',
    color: '#6366f1',
    actionUrl: `/approvals?tab=timesheets&id=${timesheetId}`,
  });
}
