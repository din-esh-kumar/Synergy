// src/controllers/approval.controller.ts - UNIFIED APPROVAL SYSTEM
import { Request, Response } from 'express';
import Leave from '../models/Leave.model';
import Expense from '../models/Expense.model';
import Timesheet from '../models/Timesheet.model';

/**
 * 📋 Get Pending Approvals (ADMIN/MANAGER)
 */
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const { type } = req.query; // 'leaves', 'expenses', 'timesheets', or 'all'

    const result: any = {};

    if (!type || type === 'all' || type === 'leaves') {
      const leaves = await Leave.find({ status: 'PENDING' })
        .sort({ createdAt: -1 })
        .populate('employeeId', 'name email designation')
        .limit(50);
      result.leaves = leaves;
    }

    if (!type || type === 'all' || type === 'expenses') {
      const expenses = await Expense.find({ status: 'PENDING' })
        .sort({ date: -1 })
        .populate('employeeId', 'name email designation')
        .populate('projectId', 'name')
        .limit(50);
      result.expenses = expenses;
    }

    if (!type || type === 'all' || type === 'timesheets') {
      const timesheets = await Timesheet.find({ status: 'SUBMITTED' })
        .sort({ date: -1 })
        .populate('employeeId', 'name email designation')
        .populate('projectId', 'name')
        .limit(50);
      result.timesheets = timesheets;
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching pending approvals'
    });
  }
};

/**
 * ✅ Approve Request (ADMIN/MANAGER)
 */
export const approveRequest = async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;
    const approverId = (req as any).user.id;

    let result;
    let message = '';

    switch (type) {
      case 'leave':
        // Call leave approval logic
        message = 'Leave approved successfully';
        break;
      case 'expense':
        // Call expense approval logic
        message = 'Expense approved successfully';
        break;
      case 'timesheet':
        // Call timesheet approval logic
        message = 'Timesheet approved successfully';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid approval type'
        });
    }

    res.status(200).json({
      success: true,
      message
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error approving request'
    });
  }
};

/**
 * ❌ Reject Request (ADMIN/MANAGER)
 */
export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    let message = '';

    switch (type) {
      case 'leave':
        message = 'Leave rejected successfully';
        break;
      case 'expense':
        message = 'Expense rejected successfully';
        break;
      case 'timesheet':
        message = 'Timesheet rejected successfully';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid approval type'
        });
    }

    res.status(200).json({
      success: true,
      message
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error rejecting request'
    });
  }
};
