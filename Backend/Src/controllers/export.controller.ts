import { Request, Response, NextFunction } from 'express';
import ExportService from '../services/export.service';

// Define UserRequest interface inline with proper Express extension
interface UserRequest extends Request {
  user?: {
    id: string;
    role: 'admin' | 'manager' | 'employee';
  };
  query: {
    userId?: string;
    projectId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  };
}

/**
 * Export Controller - Handles export requests with role-based access control
 * Validates user permissions and delegates to service layer
 * Supports multiple filters combined with AND logic
 */
export default class ExportController {
  /**
   * Export timesheets with dynamic filters
   * Supports: userId, projectId, status, startDate, endDate
   * Multiple filters are combined with AND logic
   * Only admins and managers can export
   */
  static async exportTimesheets(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;

      // Role-based access control
      if (user.role !== 'admin' && user.role !== 'manager') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Only admins and managers can export timesheets',
        });
      }

      // Extract and validate query parameters
      const allowedStatuses = new Set(['draft', 'pending', 'submitted', 'approved', 'rejected']);
      const status = req.query.status && allowedStatuses.has(req.query.status)
        ? (req.query.status as 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected')
        : undefined;

      const filters = {
        userId: req.query.userId,
        projectId: req.query.projectId,
        status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      // Fetch enriched data from service
      const data = await ExportService.getTimesheetsForExport(filters);

      return res.status(200).json({
        success: true,
        data,
        count: data.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Export expenses with dynamic filters
   * Supports: userId, status, startDate, endDate
   * Only admins and managers can export
   */
  static async exportExpenses(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;

      if (user.role !== 'admin' && user.role !== 'manager') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Only admins and managers can export expenses',
        });
      }

      const allowedStatuses = new Set(['draft', 'pending', 'submitted', 'approved', 'rejected']);
      const status = req.query.status && allowedStatuses.has(req.query.status)
        ? (req.query.status as 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected')
        : undefined;

      const filters = {
        userId: req.query.userId,
        status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const data = await ExportService.getExpensesForExport(filters);

      return res.status(200).json({
        success: true,
        data,
        count: data.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Export leaves with dynamic filters
   * Supports: userId, status, startDate, endDate
   * Only admins and managers can export
   */
  static async exportLeaves(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;

      if (user.role !== 'admin' && user.role !== 'manager') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Only admins and managers can export leaves',
        });
      }

      // Use leave module status values (no 'pending' status)
      const allowedStatuses = new Set(['draft', 'submitted', 'approved', 'rejected']);
      const status = req.query.status && allowedStatuses.has(req.query.status)
        ? (req.query.status as 'draft' | 'submitted' | 'approved' | 'rejected')
        : undefined;

      const filters = {
        userId: req.query.userId,
        status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const data = await ExportService.getLeavesForExport(filters);

      return res.status(200).json({
        success: true,
        data,
        count: data.length,
      });
    } catch (err) {
      next(err);
    }
  }
}