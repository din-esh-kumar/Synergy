// src/utils/emsNotificationIntegration.ts

import { createNotification } from './notificationEngine';

export async function notifyLeaveRequest(args: {
  approverId: string;
  employeeName: string;
  leaveType: string;
  duration: number;
  leaveId: string;
}) {
  const { approverId, employeeName, leaveType, duration, leaveId } = args;

  await createNotification({
    userId: approverId,
    type: 'system', // instead of 'LEAVE_REQUEST'
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

  const approved = status === 'approved';

  await createNotification({
    userId: employeeId,
    type: 'system', // instead of 'LEAVE_APPROVED' | 'LEAVE_REJECTED'
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

  await createNotification({
    userId: approverId,
    type: 'system', // instead of 'EXPENSE_REQUEST'
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

  await createNotification({
    userId: approverId,
    type: 'system', // instead of 'TIMESHEET_SUBMISSION'
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
