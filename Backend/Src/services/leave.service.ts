// backend/src/services/leave.service.ts
import { Types } from 'mongoose';
import Leave from '../models/Leave.model';
import LeaveType from '../models/LeaveType.model';
import LeaveBalance from '../models/LeaveBalance.model';
import Holiday from '../models/Holiday.model';
import User from '../models/User.model';

interface LeaveInput {
  userId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

interface LeaveUpdateInput {
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

export interface LeaveBalanceInitializationResult {
  leaveType: string;
  balance: number;
  status: 'created' | 'already_exists' | 'error';
  error?: string;
}

export interface UserLeaveBalanceInitializationResult {
  userId: string;
  userName: string;
  balances: LeaveBalanceInitializationResult[];
  error?: string;
}

export class LeaveService {
  // ---------- WORKING DAYS ----------
  static async getWorkingDays(startDate: string, endDate: string): Promise<number> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const holidayRecords = await Holiday.find().lean();

    const holidayDateSet = new Set<string>();

    holidayRecords.forEach((holiday: any) => {
      const holidayDate = new Date(holiday.date);
      const baseDateString = holidayDate.toISOString().split('T')[0];

      if (holiday.isRecurring) {
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();

        for (let year = startYear; year <= endYear; year++) {
          const recurringDate = new Date(year, holidayDate.getMonth(), holidayDate.getDate());
          if (recurringDate >= start && recurringDate <= end) {
            holidayDateSet.add(recurringDate.toISOString().split('T')[0]);
          }
        }
      } else {
        if (holidayDate >= start && holidayDate <= end) {
          holidayDateSet.add(baseDateString);
        }
      }
    });

    let workingDays = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const dateString = current.toISOString().split('T')[0];

      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDateSet.has(dateString)) {
        workingDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  }

  // ---------- BALANCE HELPERS ----------
  static async checkLeaveBalance(
    userId: string,
    leaveTypeId: string,
    year: number = new Date().getFullYear()
  ) {
    const balance = await LeaveBalance.findOne({
      userId: new Types.ObjectId(userId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      year,
    }).lean();

    return balance?.balance ?? 0;
  }

  static async updateLeaveBalance(
    userId: string,
    leaveTypeId: string,
    days: number,
    year: number = new Date().getFullYear()
  ) {
    const existing = await LeaveBalance.findOne({
      userId: new Types.ObjectId(userId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      year,
    });

    if (existing) {
      existing.balance += days;
      existing.updatedAt = new Date();
      await existing.save();
      return existing.toObject();
    }

    const created = await LeaveBalance.create({
      userId: new Types.ObjectId(userId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      balance: days,
      year,
    });

    return created.toObject();
  }

  // ---------- LEAVE TYPES ----------
  static async getLeaveTypes() {
    return LeaveType.find({ isActive: true }).sort({ name: 1 }).lean();
  }

  // ---------- APPLY / UPDATE / DELETE / SUBMIT ----------
  static async applyLeave(data: LeaveInput & { userId: string }) {
    const workingDays = await this.getWorkingDays(data.startDate, data.endDate);

    const leaveType = await LeaveType.findById(data.leaveTypeId).lean();
    if (!leaveType) {
      throw new Error('Leave type not found');
    }

    if (leaveType.maxDays > 0 && workingDays > leaveType.maxDays) {
      throw new Error(
        `Cannot apply for more than ${leaveType.maxDays} days of ${leaveType.name}`
      );
    }

    if (leaveType.maxDays > 0) {
      const balance = await this.checkLeaveBalance(data.userId, data.leaveTypeId);
      if (balance < workingDays) {
        throw new Error(
          `Insufficient ${leaveType.name} balance. Available: ${balance} days, Required: ${workingDays} days`
        );
      }
    }

    const leave = await Leave.create({
      userId: new Types.ObjectId(data.userId),
      leaveTypeId: new Types.ObjectId(data.leaveTypeId),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason ?? '',
      status: 'draft',
    });

    return leave.toObject();
  }

  static async updateLeave(id: string, userId: string, updates: LeaveUpdateInput) {
    const leave = await Leave.findById(id);
    if (!leave || String(leave.userId) !== String(userId)) {
      throw new Error('Leave not found or unauthorized');
    }

    if (leave.status !== 'draft') {
      throw new Error('Only draft leaves can be updated');
    }

    if (updates.leaveTypeId) {
      leave.leaveTypeId = new Types.ObjectId(updates.leaveTypeId);
    }
    if (updates.startDate) {
      leave.startDate = new Date(updates.startDate);
    }
    if (updates.endDate) {
      leave.endDate = new Date(updates.endDate);
    }
    if (updates.reason !== undefined) {
      leave.reason = updates.reason;
    }

    leave.updatedAt = new Date();
    await leave.save();
    return leave.toObject();
  }

  static async deleteLeave(id: string) {
    await Leave.findByIdAndDelete(id);
    return { success: true };
  }

  static async submitLeave(id: string, userId: string) {
    const leave = await Leave.findById(id);
    if (!leave || String(leave.userId) !== String(userId)) {
      throw new Error('Leave not found or unauthorized');
    }

    if (leave.status !== 'draft') {
      throw new Error('Only draft leaves can be submitted');
    }

    leave.status = 'submitted';
    (leave as any).appliedAt = new Date();
    leave.updatedAt = new Date();
    await leave.save();
    return leave.toObject();
  }

  // ---------- APPROVE / REJECT / RESTORE BALANCE ----------
  static async approveLeave(id: string, approvedBy: string) {
    const leave = await Leave.findById(id);
    if (!leave) {
      throw new Error('Leave not found');
    }

    const workingDays = await this.getWorkingDays(
      leave.startDate.toISOString().split('T')[0],
      leave.endDate.toISOString().split('T')[0]
    );

    const leaveType = await LeaveType.findById(leave.leaveTypeId).lean();
    if (leaveType && leaveType.maxDays > 0) {
      await this.updateLeaveBalance(
        String(leave.userId),
        String(leave.leaveTypeId),
        -workingDays
      );
    }

    leave.status = 'approved';
    (leave as any).approvedBy = new Types.ObjectId(approvedBy);
    (leave as any).approvedAt = new Date();
    leave.rejectionReason = undefined;
    leave.updatedAt = new Date();
    await leave.save();

    return leave.toObject();
  }

  static async rejectLeave(id: string, approvedBy: string, reason: string) {
    const leave = await Leave.findById(id);
    if (!leave) {
      throw new Error('Leave not found');
    }

    leave.status = 'rejected';
    (leave as any).approvedBy = new Types.ObjectId(approvedBy);
    (leave as any).approvedAt = new Date();
    leave.rejectionReason = reason;
    leave.updatedAt = new Date();
    await leave.save();

    return leave.toObject();
  }

  static async restoreLeaveBalance(leaveId: string) {
    const leave = await Leave.findById(leaveId).lean();
    if (!leave || leave.status !== 'approved') return;

    const leaveType = await LeaveType.findById(leave.leaveTypeId).lean();
    if (!leaveType || leaveType.maxDays <= 0) return;

    const workingDays = await this.getWorkingDays(
      leave.startDate.toISOString().split('T')[0],
      leave.endDate.toISOString().split('T')[0]
    );

    await this.updateLeaveBalance(
      String(leave.userId),
      String(leave.leaveTypeId),
      workingDays
    );
  }

  // ---------- QUERY: USER LEAVES ----------
  static async getLeavesByUser(userId: string) {
    const rows = await Leave.find({ userId: new Types.ObjectId(userId) })
      .populate('leaveTypeId', 'name code maxDays')
      .sort({ createdAt: -1 })
      .lean();

    return rows.map((row: any) => ({
      id: row._id,
      userId: row.userId,
      leaveTypeId: (row.leaveTypeId as any)?._id ?? row.leaveTypeId,
      startDate: row.startDate,
      endDate: row.endDate,
      reason: row.reason,
      status: row.status,
      appliedAt: row.appliedAt,
      approvedBy: row.approvedBy,
      approvedAt: row.approvedAt,
      rejectionReason: row.rejectionReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      leaveType: {
        id: (row.leaveTypeId as any)?._id ?? row.leaveTypeId,
        name: (row.leaveTypeId as any)?.name,
        code: (row.leaveTypeId as any)?.code,
        maxDays: (row.leaveTypeId as any)?.maxDays,
      },
    }));
  }

  // ---------- QUERY: LEAVES FOR APPROVAL ----------
  static async getLeavesByUsers(status: string, excludeUserId: string, role: string) {
    const baseQuery: any = {};

    if (status && status !== 'all') {
      baseQuery.status = 'submitted';
    }

    if (role === 'manager') {
      const employees = await User.find({ managerId: new Types.ObjectId(excludeUserId) })
        .select('_id')
        .lean();

      const employeeIds = employees.map(u => u._id);
      if (status === 'all') {
        employeeIds.push(new Types.ObjectId(excludeUserId));
      }

      if (employeeIds.length === 0) return [];

      baseQuery.userId = { $in: employeeIds };
    } else {
      baseQuery.userId = { $ne: new Types.ObjectId(excludeUserId) };
    }

    const rows = await Leave.find(baseQuery)
      .populate('leaveTypeId', 'name code maxDays')
      .populate('userId', 'name email managerId')
      .sort({ createdAt: -1 })
      .lean();

    return rows.map((row: any) => ({
      id: row._id,
      userId: row.userId?._id,
      leaveTypeId: (row.leaveTypeId as any)?._id ?? row.leaveTypeId,
      startDate: row.startDate,
      endDate: row.endDate,
      reason: row.reason,
      status: row.status,
      appliedAt: row.appliedAt,
      approvedBy: row.approvedBy,
      approvedAt: row.approvedAt,
      rejectionReason: row.rejectionReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      leaveType: {
        id: (row.leaveTypeId as any)?._id ?? row.leaveTypeId,
        name: (row.leaveTypeId as any)?.name,
        code: (row.leaveTypeId as any)?.code,
        maxDays: (row.leaveTypeId as any)?.maxDays,
      },
      user: {
        id: row.userId?._id,
        name: row.userId?.name,
        email: row.userId?.email,
        managerId: row.userId?.managerId,
      },
    }));
  }

  // ---------- QUERY: SINGLE LEAVE ----------
  static async getLeaveById(id: string) {
    const row: any = await Leave.findById(id)
      .populate('leaveTypeId', 'name code maxDays')
      .lean();

    if (!row) return null;

    return {
      id: row._id,
      userId: row.userId,
      leaveTypeId: (row.leaveTypeId as any)?._id ?? row.leaveTypeId,
      startDate: row.startDate,
      endDate: row.endDate,
      reason: row.reason,
      status: row.status,
      appliedAt: row.appliedAt,
      approvedBy: row.approvedBy,
      approvedAt: row.approvedAt,
      rejectionReason: row.rejectionReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      leaveType: {
        id: (row.leaveTypeId as any)?._id ?? row.leaveTypeId,
        name: (row.leaveTypeId as any)?.name,
        code: (row.leaveTypeId as any)?.code,
        maxDays: (row.leaveTypeId as any)?.maxDays,
      },
    };
  }

  // ---------- USER LEAVE BALANCES ----------
  static async getUserLeaveBalances(userId: string, year: number = new Date().getFullYear()) {
    const balances = await LeaveBalance.find({
      userId: new Types.ObjectId(userId),
      year,
    })
      .populate('leaveTypeId', 'name code maxDays')
      .lean();

    return balances.map((b: any) => ({
      id: b._id,
      balance: b.balance,
      year: b.year,
      leaveType: {
        id: (b.leaveTypeId as any)?._id ?? b.leaveTypeId,
        name: (b.leaveTypeId as any)?.name,
        code: (b.leaveTypeId as any)?.code,
        maxDays: (b.leaveTypeId as any)?.maxDays,
      },
    }));
  }

  // ---------- DEFAULT BALANCES ----------
  static getDefaultBalanceForLeaveType(leaveType: any): number {
    const code = (leaveType.code || '').toLowerCase();

    switch (code) {
      case 'al':
      case 'annual':
        return leaveType.maxDays > 0 ? leaveType.maxDays : 20;
      case 'sl':
      case 'sick':
        return leaveType.maxDays > 0 ? leaveType.maxDays : 12;
      case 'ml':
      case 'medical':
        return leaveType.maxDays > 0 ? leaveType.maxDays : 15;
      case 'cl':
      case 'casual':
        return leaveType.maxDays > 0 ? leaveType.maxDays : 7;
      case 'mat':
      case 'maternity':
        return leaveType.maxDays > 0 ? leaveType.maxDays : 180;
      case 'pat':
      case 'paternity':
        return leaveType.maxDays > 0 ? leaveType.maxDays : 14;
      default:
        return leaveType.maxDays > 0 ? leaveType.maxDays : 10;
    }
  }

  static async initializeUserLeaveBalances(
    userId: string,
    year: number = new Date().getFullYear()
  ): Promise<LeaveBalanceInitializationResult[]> {
    const leaveTypesWithDefaults = await LeaveType.find({
      isActive: true,
      hasDefaultBalance: true,
    }).lean();

    const results: LeaveBalanceInitializationResult[] = [];

    for (const lt of leaveTypesWithDefaults) {
      try {
        const existing = await LeaveBalance.findOne({
          userId: new Types.ObjectId(userId),
          leaveTypeId: lt._id,
          year,
        }).lean();

        if (!existing) {
          const defaultBalance = LeaveService.getDefaultBalanceForLeaveType(lt);
          await LeaveBalance.create({
            userId: new Types.ObjectId(userId),
            leaveTypeId: lt._id,
            balance: defaultBalance,
            year,
          });
          results.push({
            leaveType: lt.name,
            balance: defaultBalance,
            status: 'created',
          });
        } else {
          results.push({
            leaveType: lt.name,
            balance: existing.balance,
            status: 'already_exists',
          });
        }
      } catch (err: any) {
        results.push({
          leaveType: (lt as any).name,
          balance: 0,
          status: 'error',
          error: err?.message || 'Unknown error',
        });
      }
    }

    return results;
  }

  static async initializeAllUsersLeaveBalances(
    year: number = new Date().getFullYear()
  ): Promise<UserLeaveBalanceInitializationResult[]> {
    const [activeUsers, leaveTypesWithDefaults] = await Promise.all([
      User.find({ status: true }).lean(),
      LeaveType.find({ isActive: true, hasDefaultBalance: true }).lean(),
    ]);

    const existingBalances = await LeaveBalance.find({
      year,
      userId: { $in: activeUsers.map(u => u._id) },
    }).lean();

    const results: UserLeaveBalanceInitializationResult[] = [];
    const balancesToCreate: any[] = [];

    for (const user of activeUsers) {
      const userResults: LeaveBalanceInitializationResult[] = [];
      const userExisting = existingBalances.filter(
        eb => String(eb.userId) === String(user._id)
      );

      for (const lt of leaveTypesWithDefaults) {
        const existing = userExisting.find(
          eb => String(eb.leaveTypeId) === String(lt._id)
        );

        if (!existing) {
          const defaultBalance = LeaveService.getDefaultBalanceForLeaveType(lt);
          balancesToCreate.push({
            userId: user._id,
            leaveTypeId: lt._id,
            balance: defaultBalance,
            year,
          });
          userResults.push({
            leaveType: lt.name,
            balance: defaultBalance,
            status: 'created',
          });
        } else {
          userResults.push({
            leaveType: lt.name,
            balance: existing.balance,
            status: 'already_exists',
          });
        }
      }

      results.push({
        userId: String(user._id),
        userName: user.name,
        balances: userResults,
      });
    }

    if (balancesToCreate.length > 0) {
      await LeaveBalance.insertMany(balancesToCreate);
    }

    return results;
  }
}

export default LeaveService;
