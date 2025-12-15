// src/controllers/leave-admin.controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Leave, { LeaveStatus } from '../models/Leave.model';
import LeaveBalance from '../models/LeaveBalance.model';
import User from '../models/User.model';
import LeaveType from '../models/LeaveType.model';
import { createNotification } from '../utils/notificationEngine';
import Holiday, { IHoliday } from '../models/Holiday.model';

/**
 * 📋 Get All Leaves (ADMIN/MANAGER)
 */
export const getAllLeaves = async (req: Request, res: Response) => {
  try {
    const { status, leaveTypeId, startDate, endDate, userId } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (leaveTypeId) filter.leaveTypeId = leaveTypeId;
    if (userId) filter.userId = userId;
    if (startDate && endDate) {
      filter.startDate = {
        $gte: String(startDate),
        $lte: String(endDate),
      };
    }

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email designation')
      .populate('approvedBy', 'name email');

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

/**
 * ✅ Update Leave Status (ADMIN/MANAGER)
 */
export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = (req as any).user.id;
    const approverName = (req as any).user.name || (req as any).user.email;
    const { status, rejectionReason } = req.body as {
      status: 'APPROVED' | 'REJECTED';
      rejectionReason?: string;
    };

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const leave = await Leave.findById(id).populate('userId', 'name email');
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found',
      });
    }

    if (leave.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Leave already processed',
      });
    }

    const newStatus: LeaveStatus =
      status === 'APPROVED' ? 'approved' : 'rejected';

    leave.status = newStatus;
    leave.approvedBy = approverId;
    leave.approvedAt = new Date();
    if (newStatus === 'rejected' && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }

    await leave.save();

    if (newStatus === 'approved') {
      const duration = (leave as any).duration || 0;

      await LeaveBalance.findOneAndUpdate(
        {
          userId: leave.userId,
          leaveTypeId: leave.leaveTypeId,
          year: new Date().getFullYear(),
        },
        {
          $inc: {
            balance: -duration,
          },
        },
      );
    }

    const employee = leave.userId as any;
    await createNotification({
      userId: employee._id.toString(),
      type: 'system',
      action: status === 'APPROVED' ? 'completed' : 'deleted',
      title: `Leave ${status}`,
      message:
        status === 'APPROVED'
          ? `Your leave has been approved by ${approverName}`
          : `Your leave has been rejected by ${approverName}${
              rejectionReason ? `: ${rejectionReason}` : ''
            }`,
      entityType: 'leave',
      entityId: leave._id.toString(),
      icon: status === 'APPROVED' ? 'check-circle' : 'x-circle',
      color: status === 'APPROVED' ? '#10b981' : '#ef4444',
      actionUrl: `/leaves/${leave._id}`,
    });

    res.status(200).json({
      success: true,
      message: `Leave ${status.toLowerCase()} successfully`,
      data: leave,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating leave status',
    });
  }
};

/**
 * 📊 Get Leave Applications (ADMIN/MANAGER)
 */
export const getLeaveApplications = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const effectiveStatus: LeaveStatus =
      (status as LeaveStatus) || 'submitted';

    const leaves = await Leave.find({ status: effectiveStatus })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email designation phone')
      .populate('leaveTypeId', 'name code color');

    res.status(200).json({
      success: true,
      data: leaves,
      count: leaves.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leave applications',
    });
  }
};

/**
 * 📈 Get Leave Statistics (ADMIN/MANAGER)
 */
export const getLeaveStatistics = async (req: Request, res: Response) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year}-12-31T23:59:59.999Z`);

    const stats = await Leave.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDays: { $sum: '$duration' },
        },
      },
    ]);

    const byType = await Leave.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'approved',
        },
      },
      {
        $group: {
          _id: '$leaveTypeId',
          count: { $sum: 1 },
          totalDays: { $sum: '$duration' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        byType,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching statistics',
    });
  }
};

/**
 * 📊 Admin Leave Applications Overview (cards + charts)
 * - total / pending / approved / rejected for a year
 * - by leave type
 * - top users
 * - recent applications
 */
export const getLeaveApplicationsOverview = async (
  req: Request,
  res: Response,
) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year}-12-31T23:59:59.999Z`);

    // Main stats by status
    const byStatusRaw = await Leave.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const byStatus = byStatusRaw.reduce(
      (acc: Record<string, number>, row: any) => {
        acc[row._id] = row.count;
        return acc;
      },
      {},
    );

    const totalApplications =
      (byStatus.submitted || 0) +
      (byStatus.approved || 0) +
      (byStatus.rejected || 0) +
      (byStatus.draft || 0);

    // By leave type (approved only)
    const byType = await Leave.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'approved',
        },
      },
      {
        $group: {
          _id: '$leaveTypeId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'leavetypes',
          localField: '_id',
          foreignField: '_id',
          as: 'leaveType',
        },
      },
      { $unwind: { path: '$leaveType', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          leaveTypeId: '$leaveType._id',
          name: '$leaveType.name',
          color: '$leaveType.color',
          count: 1,
        },
      },
    ]);

    // Top users by number of approved leaves
    const topUsers = await Leave.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'approved',
        },
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: '$user._id',
          name: '$user.name',
          email: '$user.email',
          count: 1,
        },
      },
    ]);

    // Recent applications list
    const recentApplications = await Leave.find({
      createdAt: { $gte: start, $lte: end },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .populate('leaveTypeId', 'name color')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        year,
        stats: {
          totalApplications,
          pending: byStatus.submitted || 0,
          approved: byStatus.approved || 0,
          rejected: byStatus.rejected || 0,
        },
        byType,
        topUsers,
        recentApplications,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message:
        error.message || 'Error fetching leave applications overview',
    });
  }
};

/* ------------------------------------------------------------------
 * 🧩 LEAVE TYPES MANAGEMENT (ADMIN)
 * ------------------------------------------------------------------ */

export const createLeaveType = async (req: Request, res: Response) => {
  try {
    const {
      name,
      code,
      description,
      maxDays,
      isActive = true,
      hasDefaultBalance = false,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and code are required',
      });
    }

    const existing = await LeaveType.findOne({ code });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Leave type code already exists',
      });
    }

    const normalizedMaxDays =
      typeof maxDays === 'number' && maxDays >= 0 ? maxDays : 0;

    const leaveType = await LeaveType.create({
      name,
      code,
      description,
      maxDays: normalizedMaxDays,
      isActive,
      hasDefaultBalance,
    });

    res.status(201).json({
      success: true,
      message: 'Leave type created successfully',
      data: leaveType,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating leave type',
    });
  }
};

export const getLeaveTypes = async (req: Request, res: Response) => {
  try {
    const types = await LeaveType.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: types,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leave types',
    });
  }
};

export const updateLeaveType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      description,
      maxDays,
      isActive,
      hasDefaultBalance,
    } = req.body;

    const leaveType = await LeaveType.findById(id);
    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: 'Leave type not found',
      });
    }

    if (name !== undefined) leaveType.name = name;
    if (code !== undefined) leaveType.code = code;
    if (description !== undefined) leaveType.description = description;
    if (maxDays !== undefined && maxDays >= 0) leaveType.maxDays = maxDays;
    if (isActive !== undefined) leaveType.isActive = isActive;
    if (hasDefaultBalance !== undefined)
      leaveType.hasDefaultBalance = hasDefaultBalance;

    await leaveType.save();

    res.status(200).json({
      success: true,
      message: 'Leave type updated successfully',
      data: leaveType,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating leave type',
    });
  }
};

export const deleteLeaveType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const leaveType = await LeaveType.findById(id);
    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: 'Leave type not found',
      });
    }

    await leaveType.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Leave type deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting leave type',
    });
  }
};

/* ------------------------------------------------------------------
 * 🧮 LEAVE BALANCES (ADMIN)
 * ------------------------------------------------------------------ */

export const initializeAllUserLeaveBalances = async (
  req: Request,
  res: Response,
) => {
  try {
    const year = Number(req.body.year) || new Date().getFullYear();

    const usersList = await User.find({ isActive: true });
    const types = await LeaveType.find({ hasDefaultBalance: true });

    const ops: any[] = [];

    for (const user of usersList) {
      for (const type of types) {
        ops.push(
          LeaveBalance.updateOne(
            {
              userId: user._id,
              leaveTypeId: type._id,
              year,
            },
            {
              $setOnInsert: {
                balance: type.maxDays ?? 0,
              },
            },
            { upsert: true },
          ),
        );
      }
    }

    await Promise.all(ops);

    res.status(200).json({
      success: true,
      message: 'Leave balances initialized for all users',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error initializing leave balances',
    });
  }
};

export const initializeSingleUserLeaveBalances = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req.params;
    const year = Number(req.body.year) || new Date().getFullYear();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const types = await LeaveType.find({ hasDefaultBalance: true });

    const ops: any[] = [];

    for (const type of types) {
      ops.push(
        LeaveBalance.updateOne(
          {
            userId: user._id,
            leaveTypeId: type._id,
            year,
          },
          {
            $setOnInsert: {
              balance: type.maxDays ?? 0,
            },
          },
          { upsert: true },
        ),
      );
    }

    await Promise.all(ops);

    res.status(200).json({
      success: true,
      message: 'Leave balances initialized for user',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error initializing user leave balances',
    });
  }
};

export const getLeaveBalancesAdmin = async (req: Request, res: Response) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const balances = await LeaveBalance.find({ year })
      .populate('userId', 'name email')
      .populate('leaveTypeId', 'name code');

    res.status(200).json({
      success: true,
      data: balances,
      count: balances.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leave balances',
    });
  }
};

export const updateLeaveBalanceAdmin = async (
  req: Request,
  res: Response,
) => {
  try {
    const { balanceId } = req.params;
    const { balance } = req.body as { balance: number };

    if (typeof balance !== 'number' || balance < 0) {
      return res.status(400).json({
        success: false,
        message: 'Balance must be a non-negative number',
      });
    }

    const doc = await LeaveBalance.findById(balanceId);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Leave balance not found',
      });
    }

    doc.balance = balance;
    await doc.save();

    res.status(200).json({
      success: true,
      message: 'Leave balance updated successfully',
      data: doc,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating leave balance',
    });
  }
};

/* ------------------------------------------------------------------
 * 📅 HOLIDAYS MANAGEMENT (ADMIN)
 * ------------------------------------------------------------------ */

export const getHolidays = async (req: Request, res: Response) => {
  try {
    const year = req.query.year ? Number(req.query.year) : undefined;

    const query: any = {};
    if (year) {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      query.date = { $gte: start, $lte: end };
    }

    const holidays = await Holiday.find(query).sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: holidays,
      count: holidays.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching holidays',
    });
  }
};

export const createHoliday = async (req: Request, res: Response) => {
  try {
    const { name, date, description, isRecurring = true } =
      req.body as Partial<IHoliday>;

    if (!name || !date) {
      return res.status(400).json({
        success: false,
        message: 'Name and date are required',
      });
    }

    const normalizedDate = String(date).slice(0, 10);

    const holiday = await Holiday.create({
      name: String(name).trim(),
      date: normalizedDate,
      description: description ? String(description).trim() : '',
      isRecurring: Boolean(isRecurring),
    });

    res.status(201).json({
      success: true,
      message: 'Holiday created successfully',
      data: holiday,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating holiday',
    });
  }
};

export const updateHoliday = async (req: Request, res: Response) => {
  try {
    const { holidayId } = req.params;
    const { name, date, description, isRecurring } =
      req.body as Partial<IHoliday>;

    const holiday = await Holiday.findById(holidayId);
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found',
      });
    }

    if (name !== undefined) holiday.name = String(name).trim();
    if (date !== undefined) holiday.date = String(date).slice(0, 10);
    if (description !== undefined)
      holiday.description = String(description).trim();
    if (isRecurring !== undefined)
      holiday.isRecurring = Boolean(isRecurring);

    await holiday.save();

    res.status(200).json({
      success: true,
      message: 'Holiday updated successfully',
      data: holiday,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating holiday',
    });
  }
};

export const deleteHoliday = async (req: Request, res: Response) => {
  try {
    const { holidayId } = req.params;

    const holiday = await Holiday.findById(holidayId);
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found',
      });
    }

    await holiday.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Holiday deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting holiday',
    });
  }
};
