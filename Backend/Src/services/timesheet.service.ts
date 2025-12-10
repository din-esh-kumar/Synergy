// src/services/timesheet.service.ts
import { Types } from 'mongoose';
import Timesheet from '../models/Timesheet.model';
import User from '../models/User.model';

export interface TimesheetInput {
  userId: string;
  projectId: string;
  date: string; // ISO date
  hours: number;
  description?: string;
}

export class TimesheetService {
  static async createTimesheet(data: TimesheetInput) {
    const ts = await Timesheet.create({
      userId: new Types.ObjectId(data.userId),
      projectId: new Types.ObjectId(data.projectId),
      date: new Date(data.date),
      hours: data.hours,
      description: data.description ?? '',
      status: 'draft',
    });

    return ts.toObject();
  }

  static async updateTimesheet(id: string, userId: string, data: Partial<TimesheetInput>) {
    const ts = await Timesheet.findById(id);
    if (!ts) throw new Error('Timesheet not found');
    if (String(ts.userId) !== String(userId)) throw new Error('Unauthorized');
    if (ts.status !== 'draft') throw new Error('Only draft timesheets can be updated');

    if (data.projectId) ts.projectId = new Types.ObjectId(data.projectId);
    if (data.date) ts.date = new Date(data.date);
    if (typeof data.hours === 'number') ts.hours = data.hours;
    if (data.description !== undefined) ts.description = data.description;
    ts.updatedAt = new Date();

    await ts.save();
    return ts.toObject();
  }

  static async deleteTimesheet(id: string) {
    await Timesheet.findByIdAndDelete(id);
    return { success: true };
  }

  static async submitTimesheet(id: string, userId: string) {
    const ts = await Timesheet.findById(id);
    if (!ts || String(ts.userId) !== String(userId)) {
      throw new Error('Timesheet not found or unauthorized');
    }
    if (ts.status !== 'draft') {
      throw new Error('Only draft timesheets can be submitted');
    }

    ts.status = 'submitted';
    (ts as any).submittedAt = new Date();
    ts.updatedAt = new Date();
    await ts.save();
    return ts.toObject();
  }

  static async approveTimesheet(id: string, approvedBy: string) {
    const ts = await Timesheet.findById(id);
    if (!ts) throw new Error('Timesheet not found');
    if (ts.status !== 'submitted') throw new Error('Only submitted timesheets can be approved');

    ts.status = 'approved';
    (ts as any).approvedBy = new Types.ObjectId(approvedBy);
    (ts as any).approvedAt = new Date();
    ts.rejectionReason = undefined;
    ts.updatedAt = new Date();
    await ts.save();
    return ts.toObject();
  }

  static async rejectTimesheet(id: string, approvedBy: string, reason: string) {
    const ts = await Timesheet.findById(id);
    if (!ts) throw new Error('Timesheet not found');

    ts.status = 'rejected';
    (ts as any).approvedBy = new Types.ObjectId(approvedBy);
    (ts as any).approvedAt = new Date();
    ts.rejectionReason = reason;
    ts.updatedAt = new Date();
    await ts.save();
    return ts.toObject();
  }

  static async getTimesheetsByUser(userId: string) {
    return Timesheet.find({ userId: new Types.ObjectId(userId) }).lean();
  }

  static async getTimesheetsByUsers(status: string, excludeUserId: string, role: string) {
    const baseQuery: any = {};

    if (status && status !== 'all') {
      baseQuery.status = 'submitted';
    }

    if (role === 'manager') {
      const managedEmployees = await User.find({ managerId: new Types.ObjectId(excludeUserId) })
        .select('_id')
        .lean();
      const employeeIds = managedEmployees.map(u => u._id);
      if (employeeIds.length === 0) return [];

      baseQuery.userId = {
        $in: employeeIds,
        $ne: new Types.ObjectId(excludeUserId),
      };
    } else {
      baseQuery.userId = { $ne: new Types.ObjectId(excludeUserId) };
      if (!status || status === 'submitted') {
        baseQuery.status = 'submitted';
      }
    }

    return Timesheet.find(baseQuery).lean();
  }

  static async getTimesheetById(id: string) {
    const ts = await Timesheet.findById(id).lean();
    return ts ? [ts] : [];
  }
}

export default TimesheetService;
