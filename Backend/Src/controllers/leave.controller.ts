// src/controllers/leave.controller.ts
import { Request, Response, NextFunction } from 'express';
import LeaveService from '../services/leave.service';
import User from '../models/User.model';

interface UserRequest extends Request {
  user?: { id: string; role: string };
}

export class LeaveController {
  // ------ APPLY ------
  static async apply(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const { userId, leaveTypeId, startDate, endDate, reason } = req.body;

      let targetUserId: string | undefined = userId;

      // Permission enforcement
      if (currentUser.role === 'admin') {
        if (!targetUserId) {
          return res.status(400).json({ message: 'userId is required for admin' });
        }
        if (targetUserId === currentUser.id) {
          return res
            .status(403)
            .json({ message: 'Admin cannot create leaves for themselves' });
        }
      } else if (currentUser.role === 'manager') {
        const managedEmployees = await User.find({ managerId: currentUser.id }).select('_id');
        const managedEmployeeIds = managedEmployees.map(e => e._id.toString());

        if (
          targetUserId &&
          targetUserId !== currentUser.id &&
          !managedEmployeeIds.includes(targetUserId)
        ) {
          return res.status(403).json({
            message: 'Manager can create leaves only for self or managed employees',
          });
        }

        if (!targetUserId) {
          targetUserId = currentUser.id;
        }
      } else {
        // employee
        targetUserId = currentUser.id;
      }

      if (!leaveTypeId) {
        return res.status(400).json({ message: 'Leave type is required' });
      }
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ message: 'Start date and end date are required' });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (start > end) {
        return res
          .status(400)
          .json({ message: 'Start date cannot be after end date' });
      }
      if (start < new Date()) {
        return res
          .status(400)
          .json({ message: 'Cannot apply for leave in the past' });
      }

      const newLeave = await LeaveService.applyLeave({
        userId: targetUserId!,
        leaveTypeId,
        startDate,
        endDate,
        reason,
      });

      res.status(201).json({
        success: true,
        message: 'Leave applied successfully',
        data: newLeave,
      });
    } catch (error) {
      next(error);
    }
  }

  // ------ UPDATE ------
  static async update(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const leaveId = req.params.id;
      const currentUser = req.user!;
      const { leaveTypeId, startDate, endDate, reason } = req.body;

      const existingLeave = await LeaveService.getLeaveById(leaveId);
      if (!existingLeave) {
        return res.status(404).json({ message: 'Leave not found' });
      }

      const ownerId = existingLeave.userId.toString();

      // ownership / role checks
      if (currentUser.role === 'admin') {
        // admin can update any except own if you want; current code allows all
      } else if (currentUser.role === 'manager') {
        if (ownerId !== currentUser.id) {
          const managedEmployees = await User.find({ managerId: currentUser.id }).select('_id');
          const managedEmployeeIds = managedEmployees.map(e => e._id.toString());
          if (!managedEmployeeIds.includes(ownerId)) {
            return res.status(403).json({
              message: 'Manager can only update leaves for team members',
            });
          }
        }
      } else {
        if (ownerId !== currentUser.id) {
          return res.status(403).json({ message: 'Unauthorized to update this leave' });
        }
      }

      if (existingLeave.status !== 'draft') {
        return res
          .status(400)
          .json({ message: 'Only draft leaves can be updated' });
      }

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        if (start > end) {
          return res
            .status(400)
            .json({ message: 'Start date cannot be after end date' });
        }
      }

      const updates: any = {};
      if (leaveTypeId) updates.leaveTypeId = leaveTypeId;
      if (startDate) updates.startDate = startDate;
      if (endDate) updates.endDate = endDate;
      if (reason !== undefined) updates.reason = reason;

      const updatedLeave = await LeaveService.updateLeave(
        leaveId,
        ownerId,
        updates
      );

      res.status(200).json({
        success: true,
        message: 'Leave updated successfully',
        data: updatedLeave,
      });
    } catch (error) {
      next(error);
    }
  }

  // ------ DELETE ------
  static async delete(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const leaveId = req.params.id;
      const currentUser = req.user!;

      const existingLeave = await LeaveService.getLeaveById(leaveId);
      if (!existingLeave) {
        return res.status(404).json({ message: 'Leave not found' });
      }

      const ownerId = existingLeave.userId.toString();

      if (currentUser.role === 'admin') {
        if (ownerId === currentUser.id) {
          return res
            .status(403)
            .json({ message: 'Admin cannot delete their own leaves' });
        }
      } else if (currentUser.role === 'manager') {
        if (ownerId !== currentUser.id) {
          const managedEmployees = await User.find({ managerId: currentUser.id }).select('_id');
          const managedEmployeeIds = managedEmployees.map(e => e._id.toString());
          if (!managedEmployeeIds.includes(ownerId)) {
            return res.status(403).json({
              message: 'Manager can only delete their own or team leaves',
            });
          }
        }
      } else {
        if (ownerId !== currentUser.id) {
          return res
            .status(403)
            .json({ message: 'Unauthorized to delete this leave' });
        }
      }

      if (existingLeave.status !== 'draft') {
        return res
          .status(400)
          .json({ message: 'Only draft leaves can be deleted' });
      }

      await LeaveService.restoreLeaveBalance(leaveId);
      await LeaveService.deleteLeave(leaveId);

      res.status(200).json({
        success: true,
        message: 'Leave deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ------ SUBMIT ------
  static async submit(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const leaveId = req.params.id;
      const currentUser = req.user!;

      const existingLeave = await LeaveService.getLeaveById(leaveId);
      if (!existingLeave) {
        return res.status(404).json({ message: 'Leave not found' });
      }

      const ownerId = existingLeave.userId.toString();

      if (currentUser.role !== 'admin' && ownerId !== currentUser.id) {
        const managedEmployees = await User.find({ managerId: currentUser.id }).select('_id');
        const managedEmployeeIds = managedEmployees.map(e => e._id.toString());
        if (!managedEmployeeIds.includes(ownerId)) {
          return res
            .status(403)
            .json({ message: 'Unauthorized to submit this leave' });
        }
      }

      if (existingLeave.status !== 'draft') {
        return res
          .status(400)
          .json({ message: 'Only draft leaves can be submitted' });
      }

      const submitted = await LeaveService.submitLeave(leaveId, ownerId);

      res.status(200).json({
        success: true,
        message: 'Leave submitted for approval',
        data: submitted,
      });
    } catch (error) {
      next(error);
    }
  }

  // ------ APPROVE ------
  static async approve(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const leaveId = req.params.id;
      const approvedBy = req.user!.id;

      const existingLeave = await LeaveService.getLeaveById(leaveId);
      if (!existingLeave) {
        return res.status(404).json({ message: 'Leave not found' });
      }

      if (existingLeave.status !== 'submitted') {
        return res
          .status(400)
          .json({ message: 'Only submitted leaves can be approved' });
      }

      const approved = await LeaveService.approveLeave(leaveId, approvedBy);

      res.status(200).json({
        success: true,
        message: 'Leave approved successfully',
        data: approved,
      });
    } catch (error) {
      next(error);
    }
  }

  // ------ REJECT ------
  static async reject(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const leaveId = req.params.id;
      const approvedBy = req.user!.id;
      const { reason } = req.body;

      if (!reason) {
        return res
          .status(400)
          .json({ message: 'Rejection reason is required' });
      }

      const existingLeave = await LeaveService.getLeaveById(leaveId);
      if (!existingLeave) {
        return res.status(404).json({ message: 'Leave not found' });
      }

      if (existingLeave.status !== 'submitted') {
        return res
          .status(400)
          .json({ message: 'Only submitted leaves can be rejected' });
      }

      const rejected = await LeaveService.rejectLeave(leaveId, approvedBy, reason);

      res.status(200).json({
        success: true,
        message: 'Leave rejected successfully',
        data: rejected,
      });
    } catch (error) {
      next(error);
    }
  }

  // ------ LIST ------
  static async listByUser(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { status } = req.query as { status?: string };

      let result;

      if (user.role === 'admin' || user.role === 'manager') {
        if (status === 'all') {
          result = await LeaveService.getLeavesByUsers('all', user.id, user.role);
        } else if (status) {
          result = await LeaveService.getLeavesByUsers(status, user.id, user.role);
        } else {
          result = await LeaveService.getLeavesByUsers('all', user.id, user.role);
        }
      } else {
        result = await LeaveService.getLeavesByUser(user.id);
      }

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ------ LEAVE TYPES ------
  static async getLeaveTypes(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const types = await LeaveService.getLeaveTypes();
      res.status(200).json({ success: true, data: types });
    } catch (error) {
      next(error);
    }
  }

  // ------ BALANCES ------
  static async getLeaveBalances(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { year } = req.query as { year?: string };
      const balanceYear = year ? parseInt(year, 10) : new Date().getFullYear();

      const balances = await LeaveService.getUserLeaveBalances(userId, balanceYear);
      res.status(200).json({ success: true, data: balances });
    } catch (error) {
      next(error);
    }
  }

  // ------ WORKING DAYS ------
  static async calculateWorkingDays(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as {
        startDate?: string;
        endDate?: string;
      };

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ message: 'Start date and end date are required' });
      }

      const workingDays = await LeaveService.getWorkingDays(startDate, endDate);
      res.status(200).json({ success: true, data: workingDays });
    } catch (error) {
      next(error);
    }
  }
}

export default LeaveController;
