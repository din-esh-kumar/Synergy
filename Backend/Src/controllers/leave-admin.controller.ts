import { Request, Response, NextFunction } from 'express';
import LeaveType from '../models/LeaveType.model';
import Holiday from '../models/Holiday.model';
import LeaveBalance from '../models/LeaveBalance.model';
import User from '../models/User.model';
import { LeaveService } from '../services/leave.service';

interface UserRequest extends Request {
  user?: { id: string; role: string };
}

export class LeaveAdminController {
  // ---------------- LEAVE TYPES ----------------
  static async createLeaveType(req: UserRequest, res: Response, next: NextFunction) {
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
        return res.status(400).json({ message: 'Name and code are required' });
      }

      const existingType = await LeaveType.findOne({ code });
      if (existingType) {
        return res.status(400).json({ message: 'Leave type code already exists' });
      }

      const newLeaveType = await LeaveType.create({
        name,
        code,
        description,
        maxDays: maxDays || 0,
        isActive,
        hasDefaultBalance,
      });

      res.status(201).json({
        success: true,
        message: 'Leave type created successfully',
        data: newLeaveType,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateLeaveType(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const leaveTypeId = req.params.id;
      const { name, description, maxDays, isActive, hasDefaultBalance } = req.body;

      const existingType = await LeaveType.findById(leaveTypeId);
      if (!existingType) {
        return res.status(404).json({ message: 'Leave type not found' });
      }

      if (name !== undefined) existingType.name = name;
      if (description !== undefined) existingType.description = description;
      if (maxDays !== undefined) existingType.maxDays = maxDays;
      if (isActive !== undefined) existingType.isActive = isActive;
      if (hasDefaultBalance !== undefined) existingType.hasDefaultBalance = hasDefaultBalance;

      await existingType.save();

      res.status(200).json({
        success: true,
        message: 'Leave type updated successfully',
        data: existingType,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLeaveTypes(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const allTypes = await LeaveType.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: allTypes,
      });
    } catch (error) {
      next(error);
    }
  }

  // ---------------- HOLIDAYS ----------------
  static async createHoliday(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { name, date, description, isRecurring = true } = req.body;

      if (!name || !date) {
        return res.status(400).json({ message: 'Name and date are required' });
      }

      const newHoliday = await Holiday.create({
        name,
        date,
        description,
        isRecurring,
      });

      res.status(201).json({
        success: true,
        message: 'Holiday created successfully',
        data: newHoliday,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHolidays(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { year } = req.query as { year?: string };

      if (year) {
        const targetYear = parseInt(year, 10);

        const allHolidays = await Holiday.find().sort({ date: 1 });

        const holidaysList = allHolidays.filter(holiday => {
          const holidayDate = new Date(holiday.date);
          const holidayYear = holidayDate.getFullYear();

          if (holiday.isRecurring) {
            return true;
          }
          return holidayYear === targetYear;
        });

        res.status(200).json({
          success: true,
          data: holidaysList,
        });
      } else {
        const holidaysList = await Holiday.find().sort({ date: 1 });

        res.status(200).json({
          success: true,
          data: holidaysList,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  static async updateHoliday(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const holidayId = req.params.id;
      const { name, date, description, isRecurring } = req.body;

      if (!holidayId) {
        return res.status(400).json({
          success: false,
          message: 'Holiday ID is required',
        });
      }

      const holiday = await Holiday.findById(holidayId);
      if (!holiday) {
        return res.status(404).json({
          success: false,
          message: 'Holiday not found',
        });
      }

      let formattedDate = date as string | undefined;
      if (date && typeof date === 'string' && date.includes('/')) {
        const [day, month, yearPart] = date.split('/');
        const fullYear = yearPart.length === 2 ? `20${yearPart}` : yearPart;
        formattedDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      if (name !== undefined) holiday.name = name;
      if (date !== undefined) holiday.date = new Date(formattedDate!);
      if (description !== undefined) holiday.description = description;
      if (isRecurring !== undefined) holiday.isRecurring = isRecurring;

      await holiday.save();

      res.status(200).json({
        success: true,
        message: 'Holiday updated successfully',
        data: holiday,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteHoliday(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const holidayId = req.params.id;

      await Holiday.findByIdAndDelete(holidayId);

      res.status(200).json({
        success: true,
        message: 'Holiday deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ---------------- LEAVE BALANCES ----------------
  static async updateUserLeaveBalance(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const {
        userId,
        leaveTypeId,
        balance,
        year = new Date().getFullYear(),
      } = req.body as {
        userId: string;
        leaveTypeId: string;
        balance: number;
        year?: number;
      };

      if (!userId || !leaveTypeId || balance === undefined) {
        return res.status(400).json({
          message: 'User ID, leave type ID, and balance are required',
        });
      }

      let doc = await LeaveBalance.findOne({ userId, leaveTypeId, year });

      if (doc) {
        doc.balance = balance;
        await doc.save();
      } else {
        doc = await LeaveBalance.create({
          userId,
          leaveTypeId,
          balance,
          year,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Leave balance updated successfully',
        data: doc,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserLeaveBalances(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { userId, year } = req.query as { userId?: string; year?: string };

      const balanceYear = year ? parseInt(year, 10) : new Date().getFullYear();

      const filter: any = { year: balanceYear };
      if (userId) {
        filter.userId = userId;
      }

      const balances = await LeaveBalance.find(filter)
        .populate('userId', 'firstName lastName email')
        .populate('leaveTypeId', 'name code maxDays');

      const mapped = balances.map(b => ({
        id: b._id.toString(),
        userId: (b.userId as any)._id.toString(),
        balance: b.balance,
        year: b.year,
        leaveTypeId: (b.leaveTypeId as any)._id.toString(),
        user: {
          id: (b.userId as any)._id.toString(),
          firstName: (b.userId as any).firstName,
          lastName: (b.userId as any).lastName,
          email: (b.userId as any).email,
        },
        leaveType: {
          id: (b.leaveTypeId as any)._id.toString(),
          name: (b.leaveTypeId as any).name,
          code: (b.leaveTypeId as any).code,
          maxDays: (b.leaveTypeId as any).maxDays,
        },
      }));

      res.status(200).json({
        success: true,
        data: mapped,
      });
    } catch (error) {
      next(error);
    }
  }

  // ---------------- INITIALIZE BALANCES ----------------
  static async initializeUserLeaveBalances(
    req: UserRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId, year = new Date().getFullYear() } = req.body as {
        userId?: string;
        year?: number;
      };

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const results = await LeaveService.initializeUserLeaveBalances(userId, year);

      const createdCount = results.filter(r => r.status === 'created').length;
      const existingCount = results.filter(r => r.status === 'already_exists').length;

      res.status(200).json({
        success: true,
        message: `Leave balances initialized: ${createdCount} created, ${existingCount} already existed`,
        data: {
          user: {
            id: user._id.toString(),
            name: `${(user as any).firstName} ${(user as any).lastName}`,
          },
          year,
          results,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async initializeAllUsersLeaveBalances(
    req: UserRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { year = new Date().getFullYear() } = req.body as { year?: number };

      const results = await LeaveService.initializeAllUsersLeaveBalances(year);

      const totalCreated = results.reduce(
        (sum, user) => sum + user.balances.filter(b => b.status === 'created').length,
        0
      );
      const totalExisting = results.reduce(
        (sum, user) =>
          sum + user.balances.filter(b => b.status === 'already_exists').length,
        0
      );

      res.status(200).json({
        success: true,
        message: `Leave balances initialized for ${results.length} users: ${totalCreated} new balances created, ${totalExisting} already existed`,
        data: {
          totalUsers: results.length,
          totalCreated,
          totalExisting,
          details: results,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
