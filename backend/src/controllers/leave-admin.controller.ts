// src/controllers/leave-admin.controller.ts - MANAGER/ADMIN OPERATIONS
import { Request, Response } from 'express';
import Leave from '../models/Leave.model';
import LeaveBalance from '../models/LeaveBalance.model';
import User from '../models/User.model';
import { createNotification } from '../utils/notificationEngine';

/**
 * 📋 Get All Leaves (ADMIN/MANAGER)
 */
export const getAllLeaves = async (req: Request, res: Response) => {
  try {
    const { status, leaveType, startDate, endDate, employeeId } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;
    if (employeeId) filter.employeeId = employeeId;
    if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate('employeeId', 'name email designation')
      .populate('approverId', 'name email');

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
 * ✅ Update Leave Status (ADMIN/MANAGER)
 */
export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = (req as any).user.id;
    const approverName = (req as any).user.name || (req as any).user.email;
    const { status, rejectionReason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const leave = await Leave.findById(id).populate('employeeId', 'name email');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Leave already processed'
      });
    }

    // Update leave status
    leave.status = status;
    leave.approverId = approverId;
    leave.processedAt = new Date();
    
    if (status === 'REJECTED' && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }

    await leave.save();

    // Update leave balance if approved
    if (status === 'APPROVED') {
      await LeaveBalance.findOneAndUpdate(
        {
          employeeId: leave.employeeId._id,
          leaveType: leave.leaveType,
          year: new Date().getFullYear()
        },
        { $inc: { balance: -leave.duration, used: leave.duration } }
      );
    }

    // ✅ NOTIFY EMPLOYEE ABOUT STATUS UPDATE
    await createNotification({
      userId: leave.employeeId._id.toString(),
      type: 'system',
      action: status === 'APPROVED' ? 'completed' : 'deleted',
      title: `Leave ${status}`,
      message: status === 'APPROVED'
        ? `Your ${leave.leaveType} leave has been approved by ${approverName}`
        : `Your ${leave.leaveType} leave has been rejected by ${approverName}${rejectionReason ? `: ${rejectionReason}` : ''}`,
      entityType: 'leave',
      entityId: leave._id.toString(),
      icon: status === 'APPROVED' ? 'check-circle' : 'x-circle',
      color: status === 'APPROVED' ? '#10b981' : '#ef4444',
      actionUrl: `/leaves/${leave._id}`
    });

    res.status(200).json({
      success: true,
      message: `Leave ${status.toLowerCase()} successfully`,
      data: leave
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating leave status'
    });
  }
};

/**
 * 📊 Get Leave Applications (ADMIN/MANAGER)
 */
export const getLeaveApplications = async (req: Request, res: Response) => {
  try {
    const { status = 'PENDING' } = req.query;

    const leaves = await Leave.find({ status })
      .sort({ createdAt: -1 })
      .populate('employeeId', 'name email designation phone');

    res.status(200).json({
      success: true,
      data: leaves,
      count: leaves.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leave applications'
    });
  }
};

/**
 * 📈 Get Leave Statistics (ADMIN/MANAGER)
 */
export const getLeaveStatistics = async (req: Request, res: Response) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const stats = await Leave.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDays: { $sum: '$duration' }
        }
      }
    ]);

    const byType = await Leave.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          },
          status: 'APPROVED'
        }
      },
      {
        $group: {
          _id: '$leaveType',
          count: { $sum: 1 },
          totalDays: { $sum: '$duration' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        byType
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching statistics'
    });
  }
};
