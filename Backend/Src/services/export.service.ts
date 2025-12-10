// backend/src/services/export.service.ts
import { Types } from 'mongoose';
import Timesheet from '../models/Timesheet.model';
import Expense from '../models/Expense.model';
import Leave from '../models/Leave.model';
import User from '../models/User.model';
import Project from '../models/Project.model';
import LeaveType from '../models/LeaveType.model';

interface TimesheetExportFilters {
  userId?: string;
  projectId?: string;
  status?: 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected';
  startDate?: string;
  endDate?: string;
}

interface ExpenseExportFilters {
  userId?: string;
  status?: 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected';
  startDate?: string;
  endDate?: string;
}

interface LeaveExportFilters {
  userId?: string;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  startDate?: string;
  endDate?: string;
}

export default class ExportService {
  // ---------- TIMESHEETS ----------
  static async getTimesheetsForExport(filters: TimesheetExportFilters) {
    const query: any = {};

    if (filters.userId) {
      query.userId = new Types.ObjectId(filters.userId);
    }
    if (filters.projectId) {
      query.projectId = new Types.ObjectId(filters.projectId);
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }

    const rows = await Timesheet.find(query)
      .populate('userId', 'name email')
      .populate('projectId', 'name')
      .lean();

    const enriched = await Promise.all(
      rows.map(async (row: any) => {
        let approverName = '';

        if (row.approvedBy) {
          const approver = await User.findById(row.approvedBy)
            .select('name')
            .lean();
          if (approver?.name) {
            approverName = approver.name;
          }
        }

        const employeeName = row.userId?.name ?? '';

        return {
          id: row._id,
          date: row.date,
          hours: row.hours,
          description: row.description,
          status: row.status,
          // Model does not have submittedAt/approvedAt; use createdAt/updatedAt for export timestamps
          submittedAt: row.createdAt,
          approvedAt: row.updatedAt,
          rejectionReason: row.rejectionReason,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          userId: row.userId?._id,
          userFirstName: undefined,
          userLastName: undefined,
          userEmail: row.userId?.email,
          projectId: row.projectId?._id,
          projectName: row.projectId?.name,
          approvedBy: row.approvedBy,
          approverName,
          employeeName,
        };
      })
    );

    return enriched;
  }

  // ---------- EXPENSES ----------
  static async getExpensesForExport(filters: ExpenseExportFilters) {
    const query: any = {};

    if (filters.userId) {
      query.userId = new Types.ObjectId(filters.userId);
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    const rows = await Expense.find(query)
      .populate('userId', 'name email')
      .lean();

    const enriched = await Promise.all(
      rows.map(async (row: any) => {
        let approverName = '';

        if (row.approvedBy) {
          const approver = await User.findById(row.approvedBy)
            .select('name')
            .lean();
          if (approver?.name) {
            approverName = approver.name;
          }
        }

        const employeeName = row.userId?.name ?? '';

        return {
          id: row._id,
          amount: row.amount,
          description: row.description,
          receiptUrl: row.receiptUrl,
          status: row.status,
          submittedAt: row.createdAt,
          approvedAt: row.updatedAt,
          rejectionReason: row.rejectionReason,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          userId: row.userId?._id,
          userFirstName: undefined,
          userLastName: undefined,
          userEmail: row.userId?.email,
          approvedBy: row.approvedBy,
          approverName,
          employeeName,
        };
      })
    );

    return enriched;
  }

  // ---------- LEAVES ----------
  static async getLeavesForExport(filters: LeaveExportFilters) {
    const query: any = {};

    if (filters.userId) {
      query.userId = new Types.ObjectId(filters.userId);
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.startDate || filters.endDate) {
      query.startDate = {};
      if (filters.startDate) {
        query.startDate.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.startDate.$lte = new Date(filters.endDate);
      }
    }

    const rows = await Leave.find(query)
      .populate('userId', 'name email')
      .populate('leaveTypeId', 'name code')
      .lean();

    const enriched = await Promise.all(
      rows.map(async (row: any) => {
        let approverName = '';

        if (row.approvedBy) {
          const approver = await User.findById(row.approvedBy)
            .select('name')
            .lean();
          if (approver?.name) {
            approverName = approver.name;
          }
        }

        const employeeName = row.userId?.name ?? '';

        const duration =
          row.startDate && row.endDate
            ? Math.ceil(
                (new Date(row.endDate).getTime() -
                  new Date(row.startDate).getTime()) /
                  (1000 * 3600 * 24)
              ) + 1
            : 0;

        return {
          id: row._id,
          leaveTypeId: row.leaveTypeId?._id,
          startDate: row.startDate,
          endDate: row.endDate,
          reason: row.reason,
          status: row.status,
          appliedAt: row.createdAt,
          approvedById: row.approvedBy,
          approvedAt: row.updatedAt,
          rejectionReason: row.rejectionReason,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          userId: row.userId?._id,
          userFirstName: undefined,
          userLastName: undefined,
          userEmail: row.userId?.email,
          leaveTypeName: row.leaveTypeId?.name,
          leaveTypeCode: row.leaveTypeId?.code,
          approverName,
          employeeName,
          duration,
          leaveType: row.leaveTypeId?.name,
          approvedBy: row.approvedBy,
        };
      })
    );

    return enriched;
  }
}
