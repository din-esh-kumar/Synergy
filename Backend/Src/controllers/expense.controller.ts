// src/controllers/expense.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../services/expense.service';
import User from '../models/User.model';

interface UserRequest extends Request {
  user?: { id: string; role: string };
}

export class ExpenseController {
  // ---------------- CREATE ----------------
  static async create(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const { userId, date, amount, description } = req.body;

      let targetUserId = userId;

      // Permission enforcement
      if (currentUser.role === 'admin') {
        if (!targetUserId) {
          return res.status(400).json({ message: 'userId is required for admin' });
        }
        if (targetUserId === currentUser.id) {
          return res
            .status(403)
            .json({ message: 'Admin cannot create expenses for themselves' });
        }
      } else if (currentUser.role === 'manager') {
        const managedEmployees = await User.find({ managerId: currentUser.id }).select('id _id');
        const managedEmployeeIds = managedEmployees.map(
          e => e._id?.toString() || e._id.toString()
        );

        if (
          targetUserId &&
          targetUserId !== currentUser.id &&
          !managedEmployeeIds.includes(targetUserId)
        ) {
          return res.status(403).json({
            message: 'Manager can create expenses only for self or managed employees',
          });
        }

        if (!targetUserId) {
          targetUserId = currentUser.id;
        }
      } else {
        // Employee role - can only create for themselves
        targetUserId = currentUser.id;
      }

      // Validate required fields
      if (!date) {
        return res.status(400).json({ message: 'Expense date is required' });
      }
      if (!amount) {
        return res.status(400).json({ message: 'Amount is required' });
      }
      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res
          .status(400)
          .json({ message: 'Amount must be a positive number' });
      }

      let receiptUrl = '';

      if (req.file) {
        const base64Image = req.file.buffer.toString('base64');
        receiptUrl = `data:${req.file.mimetype};base64,${base64Image}`;
      }

      const expenseData = {
        userId: targetUserId,
        date,
        amount: parseFloat(amount),
        description: description || '',
        receiptUrl,
      };

      const newExpense = await ExpenseService.createExpense(expenseData);
      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        data: newExpense,
      });
    } catch (error) {
      next(error);
    }
  }

  // ---------------- UPDATE ----------------
  static async update(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const expenseId = req.params.id;
      const currentUser = req.user!;
      const { amount, description, date } = req.body;

      const existingExpense = await ExpenseService.getExpenseById(expenseId);
      if (!existingExpense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      const ownerId = existingExpense.userId.toString();

      // Check permissions
      if (currentUser.role === 'admin') {
        if (ownerId === currentUser.id) {
          return res
            .status(403)
            .json({ message: 'Admin cannot update their own expenses' });
        }
      } else if (currentUser.role === 'manager') {
        if (ownerId !== currentUser.id) {
          const managedEmployees = await User.find({ managerId: currentUser.id }).select(
            'id _id'
          );
          const managedEmployeeIds = managedEmployees.map(
            e => e._id?.toString() || e._id.toString()
          );

          if (!managedEmployeeIds.includes(ownerId)) {
            return res.status(403).json({
              message: 'Manager can only update their own or team expenses',
            });
          }
        }
      } else {
        // Employee role - can only update their own expenses
        if (ownerId !== currentUser.id) {
          return res.status(403).json({ message: 'Unauthorized' });
        }
      }

      if (existingExpense.status !== 'draft') {
        return res
          .status(400)
          .json({ message: 'Only draft expenses can be updated' });
      }

      // Handle receipt upload
      let receiptUrl: string | undefined;
      if (req.file) {
        const base64Image = req.file.buffer.toString('base64');
        receiptUrl = `data:${req.file.mimetype};base64,${base64Image}`;
      }

      const updateData: any = {};

      if (date !== undefined) {
        if (!date) {
          return res
            .status(400)
            .json({ message: 'Expense date cannot be empty' });
        }
        updateData.date = date;
      }
      if (amount !== undefined) {
        if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
          return res
            .status(400)
            .json({ message: 'Amount must be a positive number' });
        }
        updateData.amount = parseFloat(amount);
      }
      if (description !== undefined) updateData.description = description;
      if (receiptUrl) updateData.receiptUrl = receiptUrl;

      const updatedExpense = await ExpenseService.updateExpense(
        expenseId,
        ownerId,
        updateData
      );
      res.status(200).json({
        success: true,
        message: 'Expense updated successfully',
        data: updatedExpense,
      });
    } catch (error) {
      next(error);
    }
  }

  // ---------------- DELETE ----------------
  static async delete(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const expenseId = req.params.id;
      const currentUser = req.user!;

      const expense = await ExpenseService.getExpenseById(expenseId);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      const ownerId = expense.userId.toString();

      // Check permissions
      if (currentUser.role === 'admin') {
        if (ownerId === currentUser.id) {
          return res
            .status(403)
            .json({ message: 'Admin cannot delete their own expenses' });
        }
      } else if (currentUser.role === 'manager') {
        if (ownerId !== currentUser.id) {
          const managedEmployees = await User.find({ managerId: currentUser.id }).select(
            'id _id'
          );
          const managedEmployeeIds = managedEmployees.map(
            e => e._id?.toString() || e._id.toString()
          );

          if (!managedEmployeeIds.includes(ownerId)) {
            return res.status(403).json({
              message: 'Manager can only delete their own or team expenses',
            });
          }
        }
      } else {
        // Employee role - can only delete their own expenses
        if (ownerId !== currentUser.id) {
          return res
            .status(403)
            .json({ message: 'Unauthorized to delete this expense' });
        }
      }

      if (expense.status !== 'draft') {
        return res
          .status(400)
          .json({ message: 'Only draft expenses can be deleted' });
      }

      await ExpenseService.deleteExpense(expenseId);
      res.status(200).json({
        success: true,
        message: 'Expense deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ---------------- SUBMIT ----------------
  static async submit(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const expenseId = req.params.id;
      const currentUser = req.user!;

      const expense = await ExpenseService.getExpenseById(expenseId);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      const ownerId = expense.userId.toString();

      // Check permissions - user can submit their own expenses or managers/admins can submit for their team
      if (currentUser.role !== 'admin' && ownerId !== currentUser.id) {
        const managedEmployees = await User.find({ managerId: currentUser.id }).select(
          'id _id'
        );
        const managedEmployeeIds = managedEmployees.map(
          e => e._id?.toString() || e._id.toString()
        );

        if (!managedEmployeeIds.includes(ownerId)) {
          return res
            .status(403)
            .json({ message: 'Unauthorized to submit this expense' });
        }
      }

      if (expense.status !== 'draft') {
        return res
          .status(400)
          .json({ message: 'Only draft expenses can be submitted' });
      }

      const result = await ExpenseService.submitExpense(
        expenseId,
        ownerId
      );
      res.status(200).json({
        success: true,
        message: 'Expense submitted for approval',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ---------------- APPROVE ----------------
  static async approve(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const expenseId = req.params.id;
      const approvedBy = req.user!.id;

      const expense = await ExpenseService.getExpenseById(expenseId);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      if (expense.status !== 'submitted') {
        return res
          .status(400)
          .json({ message: 'Only submitted expenses can be approved' });
      }

      const updatedExpense = await ExpenseService.approveExpense(
        expenseId,
        approvedBy
      );
      res.status(200).json({
        success: true,
        message: 'Expense approved successfully',
        data: updatedExpense,
      });
    } catch (error) {
      next(error);
    }
  }

  // ---------------- REJECT ----------------
  static async reject(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const expenseId = req.params.id;
      const approvedBy = req.user!.id;
      const { reason } = req.body;

      if (!reason) {
        return res
          .status(400)
          .json({ message: 'Rejection reason is required' });
      }

      const expense = await ExpenseService.getExpenseById(expenseId);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      if (expense.status !== 'submitted') {
        return res
          .status(400)
          .json({ message: 'Only submitted expenses can be rejected' });
      }

      const updatedExpense = await ExpenseService.rejectExpense(
        expenseId,
        approvedBy,
        reason
      );
      res.status(200).json({
        success: true,
        message: 'Expense rejected successfully',
        data: updatedExpense,
      });
    } catch (error) {
      next(error);
    }
  }

  // ---------------- LIST ----------------
  static async listByUser(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { status, startDate, endDate } = req.query as {
        status?: string;
        startDate?: string;
        endDate?: string;
      };

      const dateFilters = startDate || endDate ? { startDate, endDate } : undefined;
      let result;

      if (user.role === 'admin' || user.role === 'manager') {
        if (status === 'all') {
          result = await ExpenseService.getExpensesByUsers(
            'all',
            user.id,
            user.role,
            dateFilters
          );
        } else if (status) {
          result = await ExpenseService.getExpensesByUsers(
            status,
            user.id,
            user.role,
            dateFilters
          );
        } else {
          result = await ExpenseService.getExpensesByUser(user.id, dateFilters);
        }
      } else {
        result = await ExpenseService.getExpensesByUser(user.id, dateFilters);
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ---------------- UPLOAD RECEIPT ----------------
  static async uploadReceipt(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const expenseId = req.params.id;
      const userId = req.user!.id;

      if (!req.file) {
        return res.status(400).json({ message: 'Receipt file is required' });
      }

      const expense = await ExpenseService.getExpenseById(expenseId);
      if (!expense || expense.userId.toString() !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      if (expense.status !== 'draft') {
        return res.status(400).json({
          message: 'Receipt can only be updated for draft expenses',
        });
      }

      const base64Image = req.file.buffer.toString('base64');
      const receiptUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      const updatedExpense = await ExpenseService.updateReceipt(
        expenseId,
        userId,
        receiptUrl
      );
      res.status(200).json({
        success: true,
        message: 'Receipt uploaded successfully',
        data: updatedExpense,
      });
    } catch (error) {
      next(error);
    }
  }

  // ---------------- DOWNLOAD RECEIPT ----------------
  static async downloadReceipt(
    req: UserRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const expenseId = req.params.id;
      const currentUser = req.user!;

      const expense = await ExpenseService.getExpenseById(expenseId);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      const ownerId = expense.userId.toString();

      if (currentUser.role !== 'admin' && ownerId !== currentUser.id) {
        const managedEmployees = await User.find({ managerId: currentUser.id }).select(
          'id _id'
        );
        const managedEmployeeIds = managedEmployees.map(
          e => e._id?.toString() || e._id.toString()
        );

        if (!managedEmployeeIds.includes(ownerId)) {
          return res.status(403).json({
            message: 'Unauthorized access to this receipt',
          });
        }
      }

      if (!expense.receiptUrl) {
        return res
          .status(404)
          .json({ message: 'No receipt uploaded for this expense' });
      }

      const matches = expense.receiptUrl.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ message: 'Invalid receipt data' });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const fileBuffer = Buffer.from(base64Data, 'base64');

      res.set('Content-Type', mimeType);
      res.set('Content-Disposition', 'inline; filename="receipt.jpg"');
      res.send(fileBuffer);
    } catch (error) {
      next(error);
    }
  }
}
