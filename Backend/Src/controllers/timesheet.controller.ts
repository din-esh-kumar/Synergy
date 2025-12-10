// src/controllers/timesheet.controller.ts
import { Request, Response, NextFunction } from 'express';
import { TimesheetService, TimesheetInput } from '../services/timesheet.service';
import User from '../models/User.model';

interface UserRequest extends Request {
  user?: { id: string; role: string; managedEmployeeIds?: string[] };
}

export class TimesheetController {
  // -------- CREATE --------
  static async create(req: UserRequest, res: Response, next: NextFunction) {
    try {
      let user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      if (user.role === 'manager') {
        const managedEmployees = await User.find({ managerId: user.id }).select('_id');
        user = {
          ...user,
          managedEmployeeIds: managedEmployees.map(e => e._id.toString()),
        };
      }

      const body = req.body;

      const timesheetData: TimesheetInput = {
        userId: body.userId,
        projectId: body.projectId,
        date:
          typeof body.date === 'string'
            ? body.date
            : new Date(body.date).toISOString(),
        hours: Number(body.hours),
        description: body.description,
      };

      if (user.role === 'admin') {
        if (timesheetData.userId === user.id) {
          return res
            .status(403)
            .json({ message: 'Admin cannot create timesheets for themselves' });
        }
        if (!timesheetData.userId) {
          return res
            .status(400)
            .json({ message: 'userId is required for admin' });
        }
      } else if (user.role === 'manager') {
        if (
          timesheetData.userId !== user.id &&
          !user.managedEmployeeIds?.includes(timesheetData.userId)
        ) {
          return res.status(403).json({
            message:
              'Manager can create timesheets only for self or managed employees',
          });
        }
      } else {
        if (timesheetData.userId !== user.id) {
          return res.status(403).json({
            message: 'Employees can only create their own timesheets',
          });
        }
      }

      const result = await TimesheetService.createTimesheet(timesheetData);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // -------- UPDATE --------
  static async update(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const currentUser = req.user!;
      const data = req.body;

      const timesheetArr = await TimesheetService.getTimesheetById(id);
      if (timesheetArr.length === 0) {
        return res.status(404).json({ message: 'Timesheet not found' });
      }

      const timesheet = timesheetArr[0];
      const ownerId = timesheet.userId.toString();

      if (currentUser.role === 'admin') {
        if (ownerId === currentUser.id) {
          return res
            .status(403)
            .json({ message: 'Admin cannot update their own timesheets' });
        }
      } else if (currentUser.role === 'manager') {
        if (ownerId !== currentUser.id) {
          const managedEmployees = await User.find({
            managerId: currentUser.id,
          }).select('_id');
          const managedEmployeeIds = managedEmployees.map(e => e._id.toString());

          if (!managedEmployeeIds.includes(ownerId)) {
            return res.status(403).json({
              message:
                'Manager can only update their own or team timesheets',
            });
          }
        }
      } else {
        if (ownerId !== currentUser.id) {
          return res.status(403).json({ message: 'Unauthorized' });
        }
      }

      const result = await TimesheetService.updateTimesheet(
        id,
        ownerId,
        data,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // -------- DELETE --------
  static async delete(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const timesheetId = req.params.id;
      const currentUser = req.user!;

      const timesheetArr = await TimesheetService.getTimesheetById(timesheetId);
      if (timesheetArr.length === 0) {
        return res.status(404).json({ message: 'Timesheet not found' });
      }

      const timesheet = timesheetArr[0];
      const ownerId = timesheet.userId.toString();

      if (currentUser.role === 'admin') {
        if (ownerId === currentUser.id) {
          return res
            .status(403)
            .json({ message: 'Admin cannot delete their own timesheets' });
        }
      } else if (currentUser.role === 'manager') {
        if (ownerId !== currentUser.id) {
          const managedEmployees = await User.find({
            managerId: currentUser.id,
          }).select('_id');
          const managedEmployeeIds = managedEmployees.map(e => e._id.toString());

          if (!managedEmployeeIds.includes(ownerId)) {
            return res.status(403).json({
              message:
                'Manager can only delete their own or team timesheets',
            });
          }
        }
      } else {
        if (ownerId !== currentUser.id) {
          return res.status(403).json({
            message: 'Unauthorized to delete this timesheet',
          });
        }
      }

      if (timesheet.status !== 'draft') {
        return res
          .status(400)
          .json({ message: 'Only draft timesheets can be deleted' });
      }

      await TimesheetService.deleteTimesheet(timesheetId);
      res
        .status(200)
        .json({ success: true, message: 'Timesheet deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // -------- SUBMIT --------
  static async submit(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const currentUser = req.user!;

      const timesheetArr = await TimesheetService.getTimesheetById(id);
      if (timesheetArr.length === 0) {
        return res.status(404).json({ message: 'Timesheet not found' });
      }

      const timesheet = timesheetArr[0];
      const ownerId = timesheet.userId.toString();

      if (currentUser.role !== 'admin' && ownerId !== currentUser.id) {
        const managedEmployees = await User.find({
          managerId: currentUser.id,
        }).select('_id');
        const managedEmployeeIds = managedEmployees.map(e => e._id.toString());

        if (!managedEmployeeIds.includes(ownerId)) {
          return res
            .status(403)
            .json({ message: 'Unauthorized to submit this timesheet' });
        }
      }

      const result = await TimesheetService.submitTimesheet(
        id,
        ownerId,
      );
      res.status(200).json({
        success: true,
        message: 'Timesheet submitted for approval',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // -------- APPROVE --------
  static async approve(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const approvedBy = req.user!.id;

      const timesheetArr = await TimesheetService.getTimesheetById(id);
      if (timesheetArr.length === 0) {
        return res.status(404).json({ message: 'Timesheet not found' });
      }

      const timesheet = timesheetArr[0];

      if (timesheet.status !== 'submitted') {
        return res
          .status(400)
          .json({ message: 'Only submitted timesheets can be approved' });
      }

      const result = await TimesheetService.approveTimesheet(id, approvedBy);
      res.status(200).json({
        success: true,
        message: 'Timesheet approved',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // -------- REJECT --------
  static async reject(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const approvedBy = req.user!.id;
      const reason = req.body.reason;

      const timesheetArr = await TimesheetService.getTimesheetById(id);
      if (timesheetArr.length === 0) {
        return res.status(404).json({ message: 'Timesheet not found' });
      }

      const timesheet = timesheetArr[0];

      if (timesheet.status !== 'submitted') {
        return res
          .status(400)
          .json({ message: 'Only submitted timesheets can be rejected' });
      }

      const result = await TimesheetService.rejectTimesheet(
        id,
        approvedBy,
        reason,
      );
      res.status(200).json({
        success: true,
        message: 'Timesheet rejected',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // -------- LIST BY USER / ROLE --------
  static async listByUser(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { status } = req.query as { status?: string };

      let result;

      if (user.role === 'admin' || user.role === 'manager') {
        if (status === 'all') {
          result = await TimesheetService.getTimesheetsByUsers(
            'all',
            user.id,
            user.role
          );
        } else if (status) {
          result = await TimesheetService.getTimesheetsByUsers(
            status,
            user.id,
            user.role
          );
        } else {
          result = await TimesheetService.getTimesheetsByUser(user.id);
        }
      } else {
        result = await TimesheetService.getTimesheetsByUser(user.id);
      }

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
