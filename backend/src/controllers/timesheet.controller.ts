// src/controllers/timesheet.controller.ts - COMPLETE WITH NOTIFICATIONS
import { Request, Response } from 'express';
import Timesheet from '../models/Timesheet.model';
import User from '../models/User.model';
import { createNotification } from '../utils/notificationEngine';

/**
 * 📝 Create Timesheet (EMPLOYEE)
 */
export const createTimesheet = async (req: Request, res: Response) => {
  try {
    const employeeId = (req as any).user.id;
    const { projectId, date, hoursWorked, taskDescription } = req.body;

    // Validation
    if (!projectId || !date || !hoursWorked || !taskDescription) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (hoursWorked < 0 || hoursWorked > 24) {
      return res.status(400).json({
        success: false,
        message: 'Hours worked must be between 0 and 24'
      });
    }

    // Check for duplicate entry
    const existingEntry = await Timesheet.findOne({
      employeeId,
      projectId,
      date: new Date(date)
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'Timesheet entry already exists for this date and project'
      });
    }

    // Create timesheet
    const timesheet = new Timesheet({
      employeeId,
      projectId,
      date,
      hoursWorked: Number(hoursWorked),
      taskDescription,
      status: 'DRAFT'
    });

    await timesheet.save();

    res.status(201).json({
      success: true,
      message: 'Timesheet entry created successfully',
      data: timesheet
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating timesheet'
    });
  }
};

/**
 * 📋 Get My Timesheets (EMPLOYEE)
 */
export const getMyTimesheets = async (req: Request, res: Response) => {
  try {
    const employeeId = (req as any).user.id;
    const { status, projectId, startDate, endDate, page = 1, limit = 10 } = req.query;

    const filter: any = { employeeId };
    
    if (status) filter.status = status;
    if (projectId) filter.projectId = projectId;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const timesheets = await Timesheet.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('employeeId', 'name email designation')
      .populate('projectId', 'name')
      .populate('approverId', 'name email');

    const total = await Timesheet.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: timesheets,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching timesheets'
    });
  }
};

/**
 * 🔍 Get Timesheet by ID
 */
export const getTimesheetById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const timesheet = await Timesheet.findById(id)
      .populate('employeeId', 'name email designation')
      .populate('projectId', 'name')
      .populate('approverId', 'name email');

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found'
      });
    }

    // Authorization check
    if (
      userRole !== 'ADMIN' &&
      userRole !== 'MANAGER' &&
      timesheet.employeeId._id.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this timesheet'
      });
    }

    res.status(200).json({
      success: true,
      data: timesheet
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching timesheet'
    });
  }
};

/**
 * ✏️ Update Timesheet (EMPLOYEE)
 */
export const updateTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = (req as any).user.id;
    const { hoursWorked, taskDescription } = req.body;

    const timesheet = await Timesheet.findById(id);

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found'
      });
    }

    // Check ownership
    if (timesheet.employeeId.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this timesheet'
      });
    }

    // Can only update draft or rejected timesheets
    if (!['DRAFT', 'REJECTED'].includes(timesheet.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update submitted or approved timesheet'
      });
    }

    // Update fields
    if (hoursWorked !== undefined) {
      if (hoursWorked < 0 || hoursWorked > 24) {
        return res.status(400).json({
          success: false,
          message: 'Hours worked must be between 0 and 24'
        });
      }
      timesheet.hoursWorked = Number(hoursWorked);
    }
    
    if (taskDescription) timesheet.taskDescription = taskDescription;

    await timesheet.save();

    res.status(200).json({
      success: true,
      message: 'Timesheet updated successfully',
      data: timesheet
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating timesheet'
    });
  }
};

/**
 * 🗑️ Delete Timesheet (EMPLOYEE)
 */
export const deleteTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = (req as any).user.id;

    const timesheet = await Timesheet.findById(id);

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found'
      });
    }

    // Check ownership
    if (timesheet.employeeId.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this timesheet'
      });
    }

    // Can only delete draft timesheets
    if (timesheet.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete submitted timesheet'
      });
    }

    await Timesheet.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Timesheet deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting timesheet'
    });
  }
};

/**
 * 📤 Submit Timesheet (EMPLOYEE)
 */
export const submitTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = (req as any).user.id;
    const employeeName = (req as any).user.name || (req as any).user.email;

    const timesheet = await Timesheet.findById(id).populate('projectId', 'name');

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found'
      });
    }

    // Check ownership
    if (timesheet.employeeId.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this timesheet'
      });
    }

    if (timesheet.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Timesheet already submitted'
      });
    }

    timesheet.status = 'SUBMITTED';
    timesheet.submittedAt = new Date();
    await timesheet.save();

    // ✅ NOTIFY MANAGERS ABOUT SUBMISSION
    const managers = await User.find({
      role: { $in: ['ADMIN', 'MANAGER'] },
      status: true
    }).select('_id name');

    if (managers.length > 0) {
      await createNotification({
        userIds: managers.map(m => m._id.toString()),
        type: 'system',
        action: 'created',
        title: 'Timesheet Submitted',
        message: `${employeeName} submitted timesheet for ${(timesheet.projectId as any)?.name || 'project'} (${timesheet.hoursWorked} hours)`,
        entityType: 'timesheet',
        entityId: timesheet._id.toString(),
        icon: 'clock',
        color: '#f59e0b',
        actionUrl: `/approvals?tab=timesheets&id=${timesheet._id}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Timesheet submitted successfully',
      data: timesheet
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting timesheet'
    });
  }
};

/**
 * ✅ Approve Timesheet (ADMIN/MANAGER)
 */
export const approveTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = (req as any).user.id;
    const approverName = (req as any).user.name || (req as any).user.email;

    const timesheet = await Timesheet.findById(id).populate('employeeId', 'name email');

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found'
      });
    }

    if (timesheet.status !== 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        message: 'Only submitted timesheets can be approved'
      });
    }

    timesheet.status = 'APPROVED';
    timesheet.approverId = approverId;
    timesheet.processedAt = new Date();
    await timesheet.save();

    // ✅ NOTIFY EMPLOYEE
    await createNotification({
      userId: timesheet.employeeId._id.toString(),
      type: 'system',
      action: 'completed',
      title: 'Timesheet Approved',
      message: `Your timesheet for ${timesheet.date.toLocaleDateString()} has been approved by ${approverName}`,
      entityType: 'timesheet',
      entityId: timesheet._id.toString(),
      icon: 'check-circle',
      color: '#10b981',
      actionUrl: `/timesheets/${timesheet._id}`
    });

    res.status(200).json({
      success: true,
      message: 'Timesheet approved successfully',
      data: timesheet
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error approving timesheet'
    });
  }
};

/**
 * ❌ Reject Timesheet (ADMIN/MANAGER)
 */
export const rejectTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = (req as any).user.id;
    const approverName = (req as any).user.name || (req as any).user.email;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const timesheet = await Timesheet.findById(id).populate('employeeId', 'name email');

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found'
      });
    }

    if (timesheet.status !== 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        message: 'Only submitted timesheets can be rejected'
      });
    }

    timesheet.status = 'REJECTED';
    timesheet.approverId = approverId;
    timesheet.rejectionReason = rejectionReason;
    timesheet.processedAt = new Date();
    await timesheet.save();

    // ✅ NOTIFY EMPLOYEE
    await createNotification({
      userId: timesheet.employeeId._id.toString(),
      type: 'system',
      action: 'deleted',
      title: 'Timesheet Rejected',
      message: `Your timesheet has been rejected by ${approverName}: ${rejectionReason}`,
      entityType: 'timesheet',
      entityId: timesheet._id.toString(),
      icon: 'x-circle',
      color: '#ef4444',
      actionUrl: `/timesheets/${timesheet._id}`
    });

    res.status(200).json({
      success: true,
      message: 'Timesheet rejected successfully',
      data: timesheet
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error rejecting timesheet'
    });
  }
};

/**
 * 📊 Get All Timesheets (ADMIN/MANAGER)
 */
export const getAllTimesheets = async (req: Request, res: Response) => {
  try {
    const { status, projectId, employeeId, startDate, endDate, page = 1, limit = 10 } = req.query;

    const filter: any = {};
    
    if (status) filter.status = status;
    if (projectId) filter.projectId = projectId;
    if (employeeId) filter.employeeId = employeeId;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const timesheets = await Timesheet.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('employeeId', 'name email designation')
      .populate('projectId', 'name')
      .populate('approverId', 'name email');

    const total = await Timesheet.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: timesheets,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching timesheets'
    });
  }
};
