// src/controllers/leave.controller.ts - SYNERGY ALIGNED WITH NOTIFICATIONS
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Leave from '../models/Leave.model';
import LeaveBalance from '../models/LeaveBalance.model';
import User from '../models/User.model';
import { createNotification } from '../utils/notificationEngine';
import { emitNotification } from '../utils/socketEmitter';

/**
 * 📝 Apply for Leave (EMPLOYEE)
 */
export const applyLeave = async (req: Request, res: Response) => {
  try {
    const employeeId = (req as any).user.id;
    const employeeName = (req as any).user.name || (req as any).user.email;
    const {
      leaveType,
      startDate,
      endDate,
      reason,
      halfDay
    } = req.body;

    // Validation
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check leave balance
    const balance = await LeaveBalance.findOne({
      employeeId,
      leaveType,
      year: new Date().getFullYear()
    });

    if (!balance || balance.balance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient leave balance'
      });
    }

    // Calculate duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = halfDay ? 0.5 : Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

    if (duration > balance.balance) {
      return res.status(400).json({
        success: false,
        message: `Only ${balance.balance} days available`
      });
    }

    // Create leave application
    const leave = new Leave({
      employeeId,
      leaveType,
      startDate,
      endDate,
      duration,
      halfDay: halfDay || false,
      reason,
      status: 'PENDING'
    });

    await leave.save();

    // ✅ FIND MANAGER/ADMIN TO NOTIFY
    const managers = await User.find({ 
      role: { $in: ['ADMIN', 'MANAGER'] },
      status: true
    }).select('_id name');

    // ✅ NOTIFY ALL MANAGERS ABOUT NEW LEAVE APPLICATION
    if (managers.length > 0) {
      await createNotification({
        userIds: managers.map(m => m._id.toString()),
        type: 'system',
        action: 'created',
        title: 'New Leave Application',
        message: `${employeeName} applied for ${leaveType} leave (${duration} days)`,
        entityType: 'leave',
        entityId: leave._id.toString(),
        icon: 'calendar',
        color: '#f59e0b',
        actionUrl: `/approvals?tab=leaves&id=${leave._id}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error applying for leave'
    });
  }
};

/**
 * 📋 Get My Leaves (EMPLOYEE)
 */
export const getMyLeaves = async (req: Request, res: Response) => {
  try {
    const employeeId = (req as any).user.id;
    const { status, year } = req.query;

    const filter: any = { employeeId };
    
    if (status) filter.status = status;
    if (year) {
      const startYear = new Date(`${year}-01-01`);
      const endYear = new Date(`${year}-12-31`);
      filter.startDate = { $gte: startYear, $lte: endYear };
    }

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate('employeeId', 'name email designation');

    res.status(200).json({
      success: true,
      data: leaves,
      count: leaves.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leaves'
    });
  }
};

/**
 * 🔍 Get Leave by ID
 */
export const getLeaveById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const leave = await Leave.findById(id)
      .populate('employeeId', 'name email designation')
      .populate('approverId', 'name email');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    // Check authorization
    if (
      userRole !== 'ADMIN' &&
      userRole !== 'MANAGER' &&
      leave.employeeId._id.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this leave'
      });
    }

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leave'
    });
  }
};

/**
 * ✏️ Update Leave (EMPLOYEE - before approval)
 */
export const updateLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = (req as any).user.id;
    const { leaveType, startDate, endDate, reason, halfDay } = req.body;

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    // Check ownership
    if (leave.employeeId.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this leave'
      });
    }

    // Can only update pending leaves
    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update non-pending leave'
      });
    }

    // Update fields
    if (leaveType) leave.leaveType = leaveType;
    if (startDate) leave.startDate = startDate;
    if (endDate) leave.endDate = endDate;
    if (reason) leave.reason = reason;
    if (halfDay !== undefined) leave.halfDay = halfDay;

    // Recalculate duration
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    leave.duration = halfDay ? 0.5 : Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave updated successfully',
      data: leave
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating leave'
    });
  }
};

/**
 * 🗑️ Cancel Leave (EMPLOYEE)
 */
export const cancelLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = (req as any).user.id;
    const employeeName = (req as any).user.name || (req as any).user.email;

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    // Check ownership
    if (leave.employeeId.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this leave'
      });
    }

    // Mark as cancelled
    leave.status = 'CANCELLED';
    await leave.save();

    // ✅ NOTIFY MANAGER ABOUT CANCELLATION
    if (leave.approverId) {
      await createNotification({
        userId: leave.approverId.toString(),
        type: 'system',
        action: 'deleted',
        title: 'Leave Cancelled',
        message: `${employeeName} cancelled their ${leave.leaveType} leave application`,
        entityType: 'leave',
        entityId: leave._id.toString(),
        icon: 'x-circle',
        color: '#ef4444',
        actionUrl: `/approvals?tab=leaves`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Leave cancelled successfully',
      data: leave
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling leave'
    });
  }
};

/**
 * 💰 Get Leave Balance (EMPLOYEE)
 */
export const getLeaveBalance = async (req: Request, res: Response) => {
  try {
    const employeeId = (req as any).user.id;
    const year = req.query.year || new Date().getFullYear();

    const balances = await LeaveBalance.find({
      employeeId,
      year: Number(year)
    });

    res.status(200).json({
      success: true,
      data: balances
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leave balance'
    });
  }
};

/**
 * 📊 Get Leave History (EMPLOYEE)
 */
export const getLeaveHistory = async (req: Request, res: Response) => {
  try {
    const employeeId = (req as any).user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const leaves = await Leave.find({ employeeId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('approverId', 'name email');

    const total = await Leave.countDocuments({ employeeId });

    res.status(200).json({
      success: true,
      data: leaves,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leave history'
    });
  }
};
