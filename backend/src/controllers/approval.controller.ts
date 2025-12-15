// src/controllers/approval.controller.ts - UNIFIED APPROVAL SYSTEM

import { Request, Response } from 'express';

import Leave from '../models/Leave.model';
import Expense from '../models/Expense.model';
import Timesheet from '../models/Timesheet.model';

/**
 * 📋 Get Pending Approvals (ADMIN/MANAGER)
 * GET /api/approvals/pending?type=leaves|expenses|timesheets|all
 */
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const { type } = req.query; // 'leaves', 'expenses', 'timesheets', or 'all'
    const result: any = {};

    // Leaves: pending = submitted
    if (!type || type === 'all' || type === 'leaves') {
      const leaves = await Leave.find({ status: 'submitted' })
        .sort({ createdAt: -1 })
        .populate('employeeId', 'name email designation')
        .limit(50);
      result.leaves = leaves;
    }

    // Expenses: pending = submitted
    if (!type || type === 'all' || type === 'expenses') {
      const expenses = await Expense.find({ status: 'submitted' })
        .sort({ date: -1 })
        .populate('employeeId', 'name email designation')
        .populate('projectId', 'name')
        .limit(50);
      result.expenses = expenses;
    }

    // Timesheets: you already use draft/submitted/approved/rejected
    if (!type || type === 'all' || type === 'timesheets') {
      const timesheets = await Timesheet.find({ status: 'submitted' })
        .sort({ date: -1 })
        .populate('employeeId', 'name email designation')
        .populate('projectId', 'name')
        .limit(50);
      result.timesheets = timesheets;
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching pending approvals',
    });
  }
};

/**
 * ✅ Approve Request (ADMIN/MANAGER)
 * PUT /api/approvals/:type/:id/approve
 * :type = 'leave' | 'expense' | 'timesheet'
 */
export const approveRequest = async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;
    const approverId = (req as any).user?.id || (req as any).user?._id;

    if (!approverId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: approverId missing on user',
      });
    }

    let message = '';
    let doc: any = null;

    switch (type) {
      case 'leave': {
        // Only submitted leaves can be approved
        doc = await Leave.findOneAndUpdate(
          { _id: id, status: 'submitted' },
          {
            status: 'approved',
            approverId,
            processedAt: new Date(),
          },
          { new: true },
        );
        message = 'Leave approved successfully';
        break;
      }
      case 'expense': {
        doc = await Expense.findOneAndUpdate(
          { _id: id, status: 'submitted' },
          {
            status: 'approved',
            approvedBy: approverId,
            approvedAt: new Date(),
            processedAt: new Date(),
            rejectionReason: '',
          },
          { new: true },
        );
        message = 'Expense approved successfully';
        break;
      }
      case 'timesheet': {
        doc = await Timesheet.findOneAndUpdate(
          { _id: id, status: 'submitted' },
          {
            status: 'approved',
            approvedBy: approverId,
            approvedAt: new Date(),
            processedAt: new Date(),
            rejectionReason: '',
          },
          { new: true },
        );
        message = 'Timesheet approved successfully';
        break;
      }
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid approval type',
        });
    }

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Record not found or not in submitted state',
      });
    }

    return res.status(200).json({
      success: true,
      message,
      data: doc,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error approving request',
    });
  }
};

/**
 * ❌ Reject Request (ADMIN/MANAGER)
 * PUT /api/approvals/:type/:id/reject
 */
export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;
    const { rejectionReason } = req.body;
    const approverId = (req as any).user?.id || (req as any).user?._id;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    if (!approverId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: approverId missing on user',
      });
    }

    let message = '';
    let doc: any = null;

    switch (type) {
      case 'leave': {
        doc = await Leave.findOneAndUpdate(
          { _id: id, status: 'submitted' },
          {
            status: 'rejected',
            approverId,
            rejectionReason,
            processedAt: new Date(),
          },
          { new: true },
        );
        message = 'Leave rejected successfully';
        break;
      }
      case 'expense': {
        doc = await Expense.findOneAndUpdate(
          { _id: id, status: 'submitted' },
          {
            status: 'rejected',
            approvedBy: approverId,
            rejectionReason,
            processedAt: new Date(),
          },
          { new: true },
        );
        message = 'Expense rejected successfully';
        break;
      }
      case 'timesheet': {
        doc = await Timesheet.findOneAndUpdate(
          { _id: id, status: 'submitted' },
          {
            status: 'rejected',
            approvedBy: approverId,
            rejectionReason,
            processedAt: new Date(),
          },
          { new: true },
        );
        message = 'Timesheet rejected successfully';
        break;
      }
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid approval type',
        });
    }

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Record not found or not in submitted state',
      });
    }

    return res.status(200).json({
      success: true,
      message,
      data: doc,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error rejecting request',
    });
  }
};
