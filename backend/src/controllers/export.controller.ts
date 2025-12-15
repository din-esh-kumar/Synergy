// backend/src/controllers/export.controller.ts
import { Request, Response, NextFunction } from 'express';
import Timesheet from '../models/Timesheet.model';
import Expense from '../models/Expense.model';
import Leave from '../models/Leave.model';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
type ExportFormat = 'json' | 'csv' | 'xlsx' | 'pdf';

interface UserRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
  query: {
    userId?: string;
    projectId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    format?: string; // string in query, normalized by getFormat
  };
}

export default class ExportController {
  // ---------- helpers ----------

  private static getFormat(req: UserRequest): ExportFormat {
    const raw = req.query.format || 'json';
    const f = raw.toLowerCase() as ExportFormat;
    if (f === 'csv' || f === 'xlsx' || f === 'pdf' || f === 'json') return f;
    return 'json';
  }

  private static ensureAdminOrManager(req: UserRequest, res: Response) {
    const user = req.user;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only admins and managers can export data',
      });
      return null;
    }
    return user;
  }

  private static sendJson(res: Response, data: any[]) {
    return res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  }

  private static async sendXlsx(
    res: Response,
    sheetName: string,
    headers: string[],
    matrix: (string | number | null | undefined)[][]
  ) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    sheet.addRow(headers);
    matrix.forEach((r) => sheet.addRow(r));

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${sheetName.toLowerCase()}_export.xlsx"`
    );
    return res.status(200).send(Buffer.from(buffer));

  }
//------------------------pdf----------------------------------

private static sendPdf(
  res: Response,
  title: string,
  headers: string[],
  matrix: (string | number | null | undefined)[][]
) {
  const doc = new PDFDocument({ margin: 40 });

  res.status(200);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${title.toLowerCase()}_export.pdf"`
  );

  doc.on('error', (err) => {
    console.error('PDF error', err);
    if (!res.headersSent) {
      res.status(500).end('PDF generation failed');
    } else {
      res.end();
    }
  });

  doc.pipe(res);

  doc.fontSize(18).text(title, { underline: true });
  doc.moveDown();

  doc.fontSize(10).text(headers.join(' | '));
  doc.moveDown(0.5);

  matrix.forEach((row) => {
    const line = row.map((v) => (v ?? '') as string).join(' | ');
    doc.text(line);
  });

  doc.end();
}

  // ---------- Timesheets ----------

  static async exportTimesheets(
    req: UserRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!ExportController.ensureAdminOrManager(req, res)) return;

      const format = ExportController.getFormat(req);

      // model uses lowercase statuses: 'draft' | 'submitted' | 'approved' | 'rejected'
      const allowedStatuses = new Set([
        'draft',
        'submitted',
        'approved',
        'rejected',
      ]);
      const status =
        req.query.status && allowedStatuses.has(req.query.status)
          ? req.query.status
          : undefined;

      const query: any = {};
      if (req.query.userId) query.employeeId = req.query.userId;
      if (req.query.projectId) query.projectId = req.query.projectId;
      if (status) query.status = status;
      if (req.query.startDate || req.query.endDate) {
        query.date = {};
        if (req.query.startDate) query.date.$gte = req.query.startDate;
        if (req.query.endDate) query.date.$lte = req.query.endDate;
      }

      const data = await Timesheet.find(query)
        .populate('employeeId')
        .populate('projectId')
        .lean();

      if (format === 'json' || format === 'csv') {
        return ExportController.sendJson(res, data);
      }

      const headers = [
        'Date',
        'Employee',
        'Project',
        'Hours',
        'Status',
        'Description',
      ];
      const matrix = data.map((t: any) => [
        t.date ? new Date(t.date).toISOString().slice(0, 10) : '',
        t.employeeId?.name || '',
        t.projectId?.name || '',
        t.hoursWorked ?? '',
        t.status || '',
        t.description || '',
      ]);

      if (format === 'xlsx') {
        return await ExportController.sendXlsx(
          res,
          'Timesheets',
          headers,
          matrix
        );
      }

      return ExportController.sendPdf(res, 'Timesheets', headers, matrix);
    } catch (err) {
      next(err);
    }
  }

  // ---------- Expenses ----------

  static async exportExpenses(
    req: UserRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!ExportController.ensureAdminOrManager(req, res)) return;

      const format = ExportController.getFormat(req);

      // model uses lowercase status; keep 'pending' only if you actually use it
      const allowedStatuses = new Set([
        'draft',
        'submitted',
        'approved',
        'rejected',
      ]);
      const status =
        req.query.status && allowedStatuses.has(req.query.status)
          ? req.query.status
          : undefined;

      const query: any = {};
      if (req.query.userId) query.employeeId = req.query.userId;
      if (status) query.status = status;
      if (req.query.startDate || req.query.endDate) {
        query.date = {};
        if (req.query.startDate) query.date.$gte = req.query.startDate;
        if (req.query.endDate) query.date.$lte = req.query.endDate;
      }

      const data = await Expense.find(query)
        .populate('employeeId')
        .populate('projectId')
        .lean();

      if (format === 'json' || format === 'csv') {
        return ExportController.sendJson(res, data);
      }

      const headers = [
        'Date',
        'Employee',
        'Project',
        'Category',
        'Amount',
        'Currency',
        'Status',
      ];
      const matrix = data.map((e: any) => [
        e.date ? e.date : '',
        e.employeeId?.name || '',
        e.projectId?.name || '',
        e.category || '',
        e.amount ?? '',
        e.currency || '',
        e.status || '',
      ]);

      if (format === 'xlsx') {
        return await ExportController.sendXlsx(res, 'Expenses', headers, matrix);
      }

      return ExportController.sendPdf(res, 'Expenses', headers, matrix);
    } catch (err) {
      next(err);
    }
  }

  // ---------- Leaves ----------

  static async exportLeaves(
    req: UserRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!ExportController.ensureAdminOrManager(req, res)) return;

      const format = ExportController.getFormat(req);

      // Leave model uses lowercase statuses
      const allowedStatuses = new Set([
        'draft',
        'submitted',
        'approved',
        'rejected',
      ]);
      const status =
        req.query.status && allowedStatuses.has(req.query.status)
          ? req.query.status
          : undefined;

      const query: any = {};
      if (req.query.userId) query.userId = req.query.userId;
      if (status) query.status = status;
      if (req.query.startDate || req.query.endDate) {
        query.startDate = {};
        if (req.query.startDate) query.startDate.$gte = req.query.startDate;
        if (req.query.endDate) query.startDate.$lte = req.query.endDate;
      }

      const data = await Leave.find(query)
        .populate('userId')
        .populate('leaveTypeId')
        .lean();

      if (format === 'json' || format === 'csv') {
        return ExportController.sendJson(res, data);
      }

      const headers = [
        'Start Date',
        'End Date',
        'Employee',
        'Leave Type',
        'Days',
        'Status',
        'Half Day',
      ];
      const matrix = data.map((l: any) => [
        l.startDate ? l.startDate : '',
        l.endDate ? l.endDate : '',
        l.userId?.name || '',
        l.leaveTypeId?.name || '',
        l.duration ?? '',
        l.status || '',
        l.halfDay ? 'Yes' : 'No',
      ]);

      if (format === 'xlsx') {
        return await ExportController.sendXlsx(res, 'Leaves', headers, matrix);
      }

      return ExportController.sendPdf(res, 'Leaves', headers, matrix);
    } catch (err) {
      next(err);
    }
  }
}
