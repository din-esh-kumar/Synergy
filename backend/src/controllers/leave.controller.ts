// src/controllers/leave.controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Leave, { LeaveStatus } from '../models/Leave.model';
import LeaveBalance from '../models/LeaveBalance.model';
import User from '../models/User.model';
import LeaveType from '../models/LeaveType.model';
import { createNotification } from '../utils/notificationEngine';
import { emitNotification } from '../utils/socketEmitter';

/** 📝 Apply for Leave (EMPLOYEE) */
export const applyLeave = async (req: Request, res: Response) => {
  try {
    const userId =
      (req as any).user?._id ||
      (req as any).user?.id ||
      (req as any).userId;

    const employeeName =
      (req as any).user?.name ||
      (req as any).user?.email ||
      'Employee';

    const {
      leaveType,
      startDate,
      endDate,
      reason,
      halfDay,
    } = req.body as {
      leaveType: string;
      startDate: string;
      endDate: string;
      reason: string;
      halfDay?: boolean;
    };

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found on request',
      });
    }

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const leaveTypeDoc = await LeaveType.findOne({
      code: leaveType.toUpperCase(),
    });

    if (!leaveTypeDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave type',
      });
    }

    const leaveTypeId = leaveTypeDoc._id;
    const year = new Date(startDate).getFullYear();

    let balance = await LeaveBalance.findOne({
      userId,
      leaveTypeId,
      year,
    });

    if (!balance) {
      balance = await LeaveBalance.create({
        userId,
        leaveTypeId,
        year,
        balance: leaveTypeDoc.maxDays ?? 0,
      });
    }

    if (balance.balance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient leave balance',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range',
      });
    }

    const rawDays =
      Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 3600 * 24),
      ) + 1;

    const duration = halfDay ? 0.5 : rawDays;

    if (duration > balance.balance) {
      return res.status(400).json({
        success: false,
        message: `Only ${balance.balance} days available`,
      });
    }

    const leave = new Leave({
      userId,
      leaveTypeId,
      startDate,
      endDate,
      duration,
      reason,
      halfDay: !!halfDay,
      status: 'submitted' as LeaveStatus,
      appliedAt: new Date(),
    });

    await leave.save();

    balance.balance -= duration;
    await balance.save();

    const managers = await User.find({
      role: { $in: ['ADMIN', 'MANAGER'] },
      status: true,
    }).select('_id name email');

    if (managers.length > 0) {
      await createNotification({
        userIds: managers.map((m) => m._id.toString()),
        type: 'system',
        action: 'created',
        title: 'New Leave Application',
        message: `${employeeName} applied for leave (${duration} days)`,
        entityType: 'leave',
        entityId: leave._id.toString(),
        icon: 'calendar',
        color: '#f59e0b',
        actionUrl: `/approvals?tab=leaves&id=${leave._id}`,
      });

      managers.forEach((m) => {
        emitNotification(m._id.toString(), {
          title: 'New Leave Application',
          body: `${employeeName} applied for leave (${duration} days)`,
          entityType: 'leave',
          entityId: leave._id.toString(),
        });
      });
    }

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error applying for leave',
    });
  }
};

/** 📋 Get My Leaves (EMPLOYEE) */
export const getMyLeaves = async (req: Request, res: Response) => {
  try {
    const userId =
      (req as any).user?._id ||
      (req as any).user?.id ||
      (req as any).userId;

    const { status, year } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found on request',
      });
    }

    const filter: any = { userId };

    if (status) {
      filter.status = status;
    }

    if (year) {
      const startYear = new Date(`${year}-01-01T00:00:00.000Z`);
      const endYear = new Date(`${year}-12-31T23:59:59.999Z`);
      filter.startDate = {
        $gte: startYear.toISOString(),
        $lte: endYear.toISOString(),
      };
    }

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email designation')
      .populate('leaveTypeId', 'name code color');

    res.status(200).json({
      success: true,
      data: leaves,
      count: leaves.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leaves',
    });
  }
};

/** 🔍 Get Leave by ID */
export const getLeaveById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId =
      (req as any).user?._id ||
      (req as any).user?.id ||
      (req as any).userId;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found on request',
      });
    }

    const leave = await Leave.findById(id)
      .populate('userId', 'name email designation')
      .populate('approvedBy', 'name email')
      .populate('leaveTypeId', 'name code color');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found',
      });
    }

    if (
      userRole !== 'ADMIN' &&
      userRole !== 'MANAGER' &&
      (leave.userId as any)._id.toString() !== String(userId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this leave',
      });
    }

    res.status(200).json({
      success: true,
      data: leave,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leave',
    });
  }
};

/** ✏️ Update Leave (EMPLOYEE - before approval) */
export const updateLeave = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const userId =
      (req as any).user?._id ||
      (req as any).user?.id ||
      (req as any).userId;

    const {
      leaveType,
      startDate,
      endDate,
      reason,
      halfDay,
    } = req.body as {
      leaveType?: string;
      startDate?: string;
      endDate?: string;
      reason?: string;
      halfDay?: boolean;
    };

    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found on request',
      });
    }

    const leave = await Leave.findById(id).session(session);

    if (!leave) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Leave not found',
      });
    }

    if (leave.userId.toString() !== String(userId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this leave',
      });
    }

    if (leave.status !== 'submitted') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot update non-pending leave',
      });
    }

    const oldDuration = leave.duration;
    const oldLeaveTypeId = leave.leaveTypeId;
    const oldYear = new Date(leave.startDate).getFullYear();

    if (leaveType) {
      const leaveTypeDoc = await LeaveType.findOne({
        code: leaveType.toUpperCase(),
      }).session(session);

      if (!leaveTypeDoc) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Invalid leave type',
        });
      }

      leave.leaveTypeId = leaveTypeDoc._id as any;
    }

    if (startDate) leave.startDate = startDate;
    if (endDate) leave.endDate = endDate;
    if (reason) leave.reason = reason;
    if (typeof halfDay === 'boolean') leave.halfDay = halfDay;

    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid date range',
      });
    }

    const rawDays =
      Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 3600 * 24),
      ) + 1;

    const newDuration = leave.halfDay ? 0.5 : rawDays;
    leave.duration = newDuration;

    const newYear = new Date(leave.startDate).getFullYear();
    const newLeaveTypeId = leave.leaveTypeId;

    const durationDiff = newDuration - oldDuration;

    if (durationDiff === 0 && String(oldLeaveTypeId) === String(newLeaveTypeId) && oldYear === newYear) {
      await leave.save({ session });
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({
        success: true,
        message: 'Leave updated successfully',
        data: leave,
      });
    }

    if (oldYear === newYear && String(oldLeaveTypeId) === String(newLeaveTypeId)) {
      const balance = await LeaveBalance.findOne({
        userId,
        leaveTypeId: newLeaveTypeId,
        year: newYear,
      }).session(session);

      if (!balance) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Leave balance not found for this type/year',
        });
      }

      if (durationDiff > 0 && balance.balance < durationDiff) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Insufficient balance to extend leave. Available: ${balance.balance} days`,
        });
      }

      balance.balance -= durationDiff;
      await balance.save({ session });
    } else {
      const oldBalance = await LeaveBalance.findOne({
        userId,
        leaveTypeId: oldLeaveTypeId,
        year: oldYear,
      }).session(session);

      if (oldBalance) {
        oldBalance.balance += oldDuration;
        await oldBalance.save({ session });
      }

      const newBalance = await LeaveBalance.findOne({
        userId,
        leaveTypeId: newLeaveTypeId,
        year: newYear,
      }).session(session);

      if (!newBalance) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Leave balance not found for new type/year',
        });
      }

      if (newDuration > newBalance.balance) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Insufficient balance for updated leave. Available: ${newBalance.balance} days`,
        });
      }

      newBalance.balance -= newDuration;
      await newBalance.save({ session });
    }

    await leave.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Leave updated successfully',
      data: leave,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating leave',
    });
  }
};

/** 🗑️ Cancel Leave (EMPLOYEE) */
export const cancelLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId =
      (req as any).user?._id ||
      (req as any).user?.id ||
      (req as any).userId;

    const employeeName =
      (req as any).user?.name ||
      (req as any).user?.email ||
      'Employee';

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found on request',
      });
    }

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found',
      });
    }

    if (leave.userId.toString() !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this leave',
      });
    }

    if (leave.status === 'submitted' || leave.status === 'approved') {
      const year = new Date(leave.startDate).getFullYear();
      await LeaveBalance.findOneAndUpdate(
        {
          userId: leave.userId,
          leaveTypeId: leave.leaveTypeId,
          year,
        },
        { $inc: { balance: leave.duration } },
      );
    }

    leave.status = 'rejected';
    await leave.save();

    if (leave.approvedBy) {
      await createNotification({
        userId: leave.approvedBy.toString(),
        type: 'system',
        action: 'deleted',
        title: 'Leave Cancelled',
        message: `${employeeName} cancelled their leave application`,
        entityType: 'leave',
        entityId: leave._id.toString(),
        icon: 'x-circle',
        color: '#ef4444',
        actionUrl: `/approvals?tab=leaves`,
      });

      emitNotification(leave.approvedBy.toString(), {
        title: 'Leave Cancelled',
        body: `${employeeName} cancelled their leave application`,
        entityType: 'leave',
        entityId: leave._id.toString(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Leave cancelled successfully',
      data: leave,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling leave',
    });
  }
};

/** 💰 Get Leave Balance (EMPLOYEE) */
export const getLeaveBalance = async (req: Request, res: Response) => {
  try {
    const userId =
      (req as any).user?._id ||
      (req as any).user?.id ||
      (req as any).userId;

    const year = Number(req.query.year) || new Date().getFullYear();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found on request',
      });
    }

    const balances = await LeaveBalance.find({
      userId,
      year,
    }).populate('leaveTypeId', 'name code color maxDays');

    res.status(200).json({
      success: true,
      data: balances,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leave balance',
    });
  }
};

/** 📊 Get Leave History (EMPLOYEE) */
export const getLeaveHistory = async (req: Request, res: Response) => {
  try {
    const userId =
      (req as any).user?._id ||
      (req as any).user?.id ||
      (req as any).userId;

    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found on request',
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const leaves = await Leave.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('approvedBy', 'name email')
      .populate('leaveTypeId', 'name code color');

    const total = await Leave.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: leaves,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leave history',
    });
  }
};
