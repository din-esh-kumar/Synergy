// backend/src/services/expense.service.ts
import { Types } from 'mongoose';
import Expense, { IExpense } from '../models/Expense.model';

interface ExpenseInput {
  userId: string;
  date: string;        // ISO or YYYY-MM-DD string
  amount: number;
  description?: string;
  receiptUrl?: string;
}

export interface ExpenseUpdateInput {
  date?: string;
  amount?: number;
  description?: string;
  receiptUrl?: string;
}

export class ExpenseService {
  // ---------- CREATE ----------
  static async createExpense(data: ExpenseInput) {
    const expenseDoc = await Expense.create({
      userId: new Types.ObjectId(data.userId),
      date: new Date(data.date),
      amount: data.amount,
      description: data.description ?? '',
      receiptUrl: data.receiptUrl ?? '',
      status: 'draft',
    });

    return expenseDoc.toObject();
  }

  // ---------- UPDATE ----------
  static async updateExpense(
    expenseId: string,
    userId: string,
    updates: ExpenseUpdateInput
  ) {
    const expense = await Expense.findById(expenseId);
    if (!expense || String(expense.userId) !== String(userId)) {
      throw new Error('Expense not found or unauthorized');
    }

    if (expense.status !== 'draft') {
      throw new Error('Only draft expenses can be updated');
    }

    if (updates.date !== undefined) {
      expense.date = new Date(updates.date);
    }
    if (updates.amount !== undefined) {
      expense.amount = updates.amount;
    }
    if (updates.description !== undefined) {
      expense.description = updates.description;
    }
    if (updates.receiptUrl !== undefined) {
      expense.receiptUrl = updates.receiptUrl;
    }

    expense.updatedAt = new Date();
    await expense.save();
    return expense.toObject();
  }

  // ---------- DELETE ----------
  static async deleteExpense(id: string) {
    const expense = await Expense.findById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    if (expense.status !== 'draft') {
      throw new Error('Only draft expenses can be deleted');
    }

    await Expense.findByIdAndDelete(id);
    return { success: true };
  }

  // ---------- SUBMIT ----------
  static async submitExpense(id: string, userId: string) {
    const expense = await Expense.findById(id);
    if (!expense || String(expense.userId) !== String(userId)) {
      throw new Error('Expense not found or unauthorized');
    }

    if (expense.status !== 'draft') {
      throw new Error('Only draft expenses can be submitted');
    }

    expense.status = 'submitted';
    // optional: add submittedAt if you later extend schema
    expense.updatedAt = new Date();
    await expense.save();

    return expense.toObject();
  }

  // ---------- APPROVE ----------
  static async approveExpense(id: string, approvedBy: string) {
    const expense = await Expense.findById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    if (expense.status !== 'submitted') {
      throw new Error('Only submitted expenses can be approved');
    }

    expense.status = 'approved';
    expense.approvedBy = new Types.ObjectId(approvedBy);
    // optional approvedAt: add to schema if needed
    expense.rejectionReason = undefined;
    expense.updatedAt = new Date();
    await expense.save();

    return expense.toObject();
  }

  // ---------- REJECT ----------
  static async rejectExpense(id: string, approvedBy: string, reason: string) {
    const expense = await Expense.findById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    if (expense.status !== 'submitted') {
      throw new Error('Only submitted expenses can be rejected');
    }

    expense.status = 'rejected';
    expense.approvedBy = new Types.ObjectId(approvedBy);
    // optional approvedAt: add to schema if needed
    expense.rejectionReason = reason;
    expense.updatedAt = new Date();
    await expense.save();

    return expense.toObject();
  }

  // ---------- UPDATE RECEIPT ----------
  static async updateReceipt(
    expenseId: string,
    userId: string,
    receiptUrl: string
  ) {
    const expense = await Expense.findById(expenseId);
    if (!expense || String(expense.userId) !== String(userId)) {
      throw new Error('Expense not found or unauthorized');
    }
    if (expense.status !== 'draft') {
      throw new Error('Receipt can only be updated for draft expenses');
    }

    expense.receiptUrl = receiptUrl;
    expense.updatedAt = new Date();
    await expense.save();

    return expense.toObject();
  }

  // ---------- GET BY ID ----------
  static async getExpenseById(expenseId: string) {
    const expense = await Expense.findById(expenseId);
    return expense ? expense.toObject() : null;
  }

  // ---------- LIST BY USER ----------
  static async getExpensesByUser(
    userId: string,
    filters?: { startDate?: string; endDate?: string }
  ) {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    return expenses.map(e => e.toObject());
  }

  // ---------- LIST FOR ADMIN/MANAGER ----------
  static async getExpensesByUsers(
    status: string,
    excludeUserId: string,
    role: string,
    filters?: { startDate?: string; endDate?: string }
  ) {
    const query: any = {};

    // Base user filter: exclude current user
    query.userId = { $ne: new Types.ObjectId(excludeUserId) };

    // Status filter: for now, mimic old behavior (submitted when not "all")
    if (status && status !== 'all') {
      query.status = 'submitted';
    }

    if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    return expenses.map(e => e.toObject());
  }
}

export default ExpenseService;
