import { Request, Response, NextFunction } from 'express';
import { TimesheetService } from '../services/timesheet.service';
import { ExpenseService } from '../services/expense.service';
import { LeaveService } from '../services/leave.service';

interface UserRequest extends Request {
  user?: { id: string };
}
export class ApprovalController {
  static async approve(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { type, id } = req.params;
      const approvedBy = req.user!.id;

      switch (type) {
        case 'timesheet':
          await TimesheetService.approveTimesheet(id, approvedBy);
          break;
        case 'expense':
          await ExpenseService.approveExpense(id, approvedBy);
          break;
        case 'leave':
          await LeaveService.approveLeave(id, approvedBy);
          break;
        default:
          throw new Error('Invalid approval type');
      }

      res.status(200).json({ success: true, message: `${type} approved successfully` });
    } catch (error) {
      next(error);
    }
  }

  static async reject(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { type, id } = req.params;
      const approvedBy = req.user!.id;
      const { reason } = req.body;

      switch (type) {
        case 'timesheet':
          await TimesheetService.rejectTimesheet(id, approvedBy, reason);
          break;
        case 'expense':
          await ExpenseService.rejectExpense(id, approvedBy, reason);
          break;
        case 'leave':
          await LeaveService.rejectLeave(id, approvedBy, reason);
          break;
        default:
          throw new Error('Invalid rejection type');
      }

      res.status(200).json({ success: true, message: `${type} rejected successfully` });
    } catch (error) {
      next(error);
    }
  }
}
