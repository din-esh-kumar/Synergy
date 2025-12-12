// src/utils/emsNotificationIntegration.ts - NEW FILE
import { createNotification } from './notificationEngine';
import { emitNotification } from './socketEmitter';

/**
 * Send leave application notification to managers/admins
 */
export const notifyLeaveApplication = async (
  leave: any,
  applicant: any
) => {
  const notification = await createNotification({
    recipientId: leave.managerId, // Send to manager
    senderId: applicant._id,
    type: 'LEAVE_REQUEST',
    title: 'New Leave Application',
    message: `${applicant.name} applied for ${leave.leaveType} leave from ${leave.startDate} to ${leave.endDate}`,
    metadata: {
      leaveId: leave._id,
      applicantId: applicant._id,
      leaveType: leave.leaveType
    },
    actionUrl: `/approvals?tab=leaves&id=${leave._id}`
  });

  // Real-time notification via Socket.IO
  emitNotification(leave.managerId.toString(), notification);
};

/**
 * Send leave status update notification to employee
 */
export const notifyLeaveStatusUpdate = async (
  leave: any,
  approver: any,
  status: string
) => {
  const notification = await createNotification({
    recipientId: leave.employeeId,
    senderId: approver._id,
    type: status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
    title: `Leave ${status}`,
    message: `Your ${leave.leaveType} leave from ${leave.startDate} to ${leave.endDate} has been ${status.toLowerCase()} by ${approver.name}`,
    metadata: {
      leaveId: leave._id,
      approverId: approver._id,
      status
    },
    actionUrl: `/leaves/${leave._id}`
  });

  emitNotification(leave.employeeId.toString(), notification);
};

/**
 * Send expense approval notification
 */
export const notifyExpenseSubmission = async (
  expense: any,
  employee: any
) => {
  const notification = await createNotification({
    recipientId: expense.approverId,
    senderId: employee._id,
    type: 'EXPENSE_REQUEST',
    title: 'New Expense Claim',
    message: `${employee.name} submitted an expense claim of ₹${expense.amount} for ${expense.category}`,
    metadata: {
      expenseId: expense._id,
      employeeId: employee._id,
      amount: expense.amount
    },
    actionUrl: `/approvals?tab=expenses&id=${expense._id}`
  });

  emitNotification(expense.approverId.toString(), notification);
};

/**
 * Send timesheet submission notification
 */
export const notifyTimesheetSubmission = async (
  timesheet: any,
  employee: any
) => {
  const notification = await createNotification({
    recipientId: timesheet.approverId,
    senderId: employee._id,
    type: 'TIMESHEET_SUBMISSION',
    title: 'Timesheet Submitted',
    message: `${employee.name} submitted timesheet for week ${timesheet.weekNumber}`,
    metadata: {
      timesheetId: timesheet._id,
      employeeId: employee._id
    },
    actionUrl: `/approvals?tab=timesheets&id=${timesheet._id}`
  });

  emitNotification(timesheet.approverId.toString(), notification);
};
