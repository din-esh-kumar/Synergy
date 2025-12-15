// src/controllers/timesheet.controller.ts
import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import Timesheet from '../models/Timesheet.model';
import User from '../models/User.model';
import { createNotification } from '../utils/notificationEngine';

/**
 * 🔍 Validate ObjectId safely
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

/**
 * 📝 Create Timesheet (EMPLOYEE / MANAGER / ADMIN)
 */
export const createTimesheet = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const authUserId = validateObjectId(authUser?._id);
    const authRole = authUser?.role;

    if (!authUserId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found',
      });
    }

    const {
      projectId,
      date,
      hours,
      hoursWorked,
      taskDescription,
      description,
      userId,
    } = req.body;

    const effectiveHours = hours ?? hoursWorked;
    const finalDescription = description ?? taskDescription;

    const employeeId = authRole === 'ADMIN' || authRole === 'MANAGER'
      ? validateObjectId(userId) || authUserId
      : authUserId;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID required for admin/manager',
      });
    }

    if (!projectId || !date || effectiveHours == null || !finalDescription) {
      return res.status(400).json({
        success: false,
        message: 'Project, date, hours worked, and description are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID',
      });
    }

    const hoursNum = Number(effectiveHours);
    if (isNaN(hoursNum) || hoursNum < 0 || hoursNum > 24) {
      return res.status(400).json({
        success: false,
        message: 'Hours worked must be between 0 and 24',
      });
    }

    // Prevent duplicate entry for same employee + project + date
    const existingEntry = await Timesheet.findOne({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      projectId: new mongoose.Types.ObjectId(projectId),
      date: new Date(date),
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'Timesheet entry already exists for this date and project',
      });
    }

    const timesheet = new Timesheet({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      projectId: new mongoose.Types.ObjectId(projectId),
      date: new Date(date),
      hoursWorked: hoursNum,
      description: finalDescription,
      status: 'draft',
    });

    await timesheet.save();

    return res.status(201).json({
      success: true,
      message: 'Timesheet entry created successfully',
      data: timesheet,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating timesheet',
    });
  }
};

/**
 * 📋 Get My Timesheets (EMPLOYEE)
 */
export const getMyTimesheets = async (req: Request, res: Response) => {
  try {
    const employeeId = validateObjectId((req as any).user?._id);
    
    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found',
      });
    }

    const { status, projectId, startDate, endDate, page = '1', limit = '10' } = req.query;

    const filter: any = { 
      employeeId: new mongoose.Types.ObjectId(employeeId)
    };

    if (status) filter.status = status;
    if (projectId) filter.projectId = new mongoose.Types.ObjectId(projectId as string);
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const timesheets = await Timesheet.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('employeeId', 'name email designation')
      .populate('projectId', 'name')
      .populate('approvedBy', 'name email');

    const total = await Timesheet.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: timesheets,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching timesheets',
    });
  }
};

/**
 * 🔍 Get Timesheet by ID
 */
export const getTimesheetById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = validateObjectId((req as any).user?._id);
    const userRole = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timesheet ID',
      });
    }

    const timesheet = await Timesheet.findById(id)
      .populate('employeeId', 'name email designation')
      .populate('projectId', 'name')
      .populate('approvedBy', 'name email');

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found',
      });
    }

    if (
      userRole !== 'ADMIN' &&
      userRole !== 'MANAGER' &&
      timesheet.employeeId.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this timesheet',
      });
    }

    return res.status(200).json({
      success: true,
      data: timesheet,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching timesheet',
    });
  }
};

/**
 * ✏️ Update Timesheet (EMPLOYEE)
 */
export const updateTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = validateObjectId((req as any).user?._id);

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timesheet ID',
      });
    }

    const { hours, hoursWorked, taskDescription, description } = req.body;

    const timesheet = await Timesheet.findById(id);

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found',
      });
    }

    if (timesheet.employeeId.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this timesheet',
      });
    }

    if (!['draft', 'rejected'].includes(timesheet.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update submitted or approved timesheet',
      });
    }

    const effectiveHours = hours ?? hoursWorked;

    if (effectiveHours != null) {
      const hoursNum = Number(effectiveHours);
      if (isNaN(hoursNum) || hoursNum < 0 || hoursNum > 24) {
        return res.status(400).json({
          success: false,
          message: 'Hours worked must be between 0 and 24',
        });
      }
      timesheet.hoursWorked = hoursNum;
    }

    const finalDescription = description ?? taskDescription;
    if (finalDescription) {
      timesheet.description = finalDescription;
    }

    await timesheet.save();

    return res.status(200).json({
      success: true,
      message: 'Timesheet updated successfully',
      data: timesheet,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating timesheet',
    });
  }
};

/**
 * 🗑️ Delete Timesheet (EMPLOYEE)
 */
export const deleteTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = validateObjectId((req as any).user?._id);

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timesheet ID',
      });
    }

    const timesheet = await Timesheet.findById(id);

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found',
      });
    }

    if (timesheet.employeeId.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this timesheet',
      });
    }

    if (timesheet.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete submitted or processed timesheet',
      });
    }

    await Timesheet.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Timesheet deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting timesheet',
    });
  }
};

/**
 * 📤 Submit Timesheet (EMPLOYEE)
 */
export const submitTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = validateObjectId((req as any).user?._id);
    const employeeName = (req as any).user.name || (req as any).user.email;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timesheet ID',
      });
    }

    const timesheet = await Timesheet.findById(id).populate('projectId', 'name');

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found',
      });
    }

    if (timesheet.employeeId.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this timesheet',
      });
    }

    if (timesheet.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Timesheet already submitted or processed',
      });
    }

    timesheet.status = 'submitted';
    timesheet.submittedAt = new Date();
    await timesheet.save();

    // ✅ SAFE: Notify managers with validated IDs
    const managers = await User.find({
      role: { $in: ['ADMIN', 'MANAGER'] },
      status: true,
    }).select('_id name');

    const validManagerIds = managers
      .map((m) => validateObjectId(m._id))
      .filter((id): id is string => !!id);

    if (validManagerIds.length > 0) {
      await createNotification({
        userIds: validManagerIds,
        type: 'system',
        action: 'created',
        title: 'Timesheet Submitted',
        message: `${employeeName} submitted timesheet for ${
          (timesheet.projectId as any)?.name || 'project'
        } (${timesheet.hoursWorked} hours)`,
        entityType: 'timesheet',
        entityId: timesheet._id.toString(),
        icon: 'clock',
        color: '#f59e0b',
        actionUrl: `/approvals?tab=timesheets&id=${timesheet._id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Timesheet submitted successfully',
      data: timesheet,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error submitting timesheet',
    });
  }
};

/**
 * ✅ Approve Timesheet (ADMIN/MANAGER)
 */
export const approveTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = validateObjectId((req as any).user?._id);
    const approverName = (req as any).user.name || (req as any).user.email;

    if (!approverId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timesheet ID',
      });
    }

    const timesheet = await Timesheet.findById(id).populate('employeeId', 'name email');

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found',
      });
    }

    if (timesheet.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Only submitted timesheets can be approved',
      });
    }

    timesheet.status = 'approved';
    timesheet.approvedBy = new mongoose.Types.ObjectId(approverId);
    timesheet.approvedAt = new Date();
    timesheet.processedAt = new Date();
    await timesheet.save();

    // ✅ SAFE: Notify employee with validated ID
    const employeeId = validateObjectId(timesheet.employeeId);
    if (employeeId) {
      await createNotification({
        userId: employeeId,
        type: 'system',
        action: 'completed',
        title: 'Timesheet Approved',
        message: `Your timesheet for ${timesheet.date.toLocaleDateString()} has been approved by ${approverName}`,
        entityType: 'timesheet',
        entityId: timesheet._id.toString(),
        icon: 'check-circle',
        color: '#10b981',
        actionUrl: `/timesheets/${timesheet._id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Timesheet approved successfully',
      data: timesheet,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error approving timesheet',
    });
  }
};

/**
 * ❌ Reject Timesheet (ADMIN/MANAGER)
 */
export const rejectTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = validateObjectId((req as any).user?._id);
    const approverName = (req as any).user.name || (req as any).user.email;
    const { rejectionReason } = req.body;

    if (!approverId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timesheet ID',
      });
    }

    const timesheet = await Timesheet.findById(id).populate('employeeId', 'name email');

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found',
      });
    }

    if (timesheet.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Only submitted timesheets can be rejected',
      });
    }

    timesheet.status = 'rejected';
    timesheet.approvedBy = new mongoose.Types.ObjectId(approverId);
    timesheet.rejectionReason = rejectionReason;
    timesheet.processedAt = new Date();
    await timesheet.save();

    // ✅ SAFE: Notify employee with validated ID
    const employeeId = validateObjectId(timesheet.employeeId);
    if (employeeId) {
      await createNotification({
        userId: employeeId,
        type: 'system',
        action: 'deleted',
        title: 'Timesheet Rejected',
        message: `Your timesheet has been rejected by ${approverName}: ${rejectionReason}`,
        entityType: 'timesheet',
        entityId: timesheet._id.toString(),
        icon: 'x-circle',
        color: '#ef4444',
        actionUrl: `/timesheets/${timesheet._id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Timesheet rejected successfully',
      data: timesheet,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error rejecting timesheet',
    });
  }
};

/**
 * 📊 Get All Timesheets (ADMIN/MANAGER)
 */
export const getAllTimesheets = async (req: Request, res: Response) => {
  try {
    const {
      status,
      projectId,
      employeeId,
      startDate,
      endDate,
      page = '1',
      limit = '10',
    } = req.query;

    const filter: any = {};

    if (status) filter.status = status;
    if (projectId) filter.projectId = new mongoose.Types.ObjectId(projectId as string);
    if (employeeId) filter.employeeId = new mongoose.Types.ObjectId(employeeId as string);
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const timesheets = await Timesheet.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('employeeId', 'name email designation')
      .populate('projectId', 'name')
      .populate('approvedBy', 'name email');

    const total = await Timesheet.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: timesheets,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching timesheets',
    });
  }
};
