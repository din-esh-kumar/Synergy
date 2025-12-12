// src/controllers/expense.controller.ts - COMPLETE WITH NOTIFICATIONS
import { Request, Response } from 'express';
import Expense from '../models/Expense.model';
import User from '../models/User.model';
import { createNotification } from '../utils/notificationEngine';
import path from 'path';
import fs from 'fs';

/**
 * 💵 Create Expense (EMPLOYEE)
 */
export const createExpense = async (req: Request, res: Response) => {
  try {
    const employeeId = (req as any).user.id;
    const employeeName = (req as any).user.name || (req as any).user.email;
    const {
      category,
      amount,
      currency,
      date,
      description,
      projectId,
      merchantName
    } = req.body;

    // Validation
    if (!category || !amount || !date || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category, amount, date, and description are required'
      });
    }

    // Handle receipt upload
    let receiptPath = undefined;
    if (req.file) {
      receiptPath = `/uploads/${req.file.filename}`;
    }

    // Create expense
    const expense = new Expense({
      employeeId,
      category,
      amount: Number(amount),
      currency: currency || 'INR',
      date,
      description,
      projectId: projectId || undefined,
      merchantName: merchantName || undefined,
      receipt: receiptPath,
      status: 'PENDING'
    });

    await expense.save();

    // ✅ FIND MANAGERS TO NOTIFY
    const managers = await User.find({
      role: { $in: ['ADMIN', 'MANAGER'] },
      status: true
    }).select('_id name');

    // ✅ NOTIFY MANAGERS ABOUT NEW EXPENSE
    if (managers.length > 0) {
      await createNotification({
        userIds: managers.map(m => m._id.toString()),
        type: 'system',
        action: 'created',
        title: 'New Expense Claim',
        message: `${employeeName} submitted an expense claim of ₹${amount} for ${category}`,
        entityType: 'expense',
        entityId: expense._id.toString(),
        icon: 'credit-card',
        color: '#f59e0b',
        actionUrl: `/approvals?tab=expenses&id=${expense._id}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Expense submitted successfully',
      data: expense
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating expense'
    });
  }
};

/**
 * 📋 Get My Expenses (EMPLOYEE)
 */
export const getMyExpenses = async (req: Request, res: Response) => {
  try {
    const employeeId = (req as any).user.id;
    const { status, category, startDate, endDate, page = 1, limit = 10 } = req.query;

    const filter: any = { employeeId };
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('employeeId', 'name email designation')
      .populate('approverId', 'name email')
      .populate('projectId', 'name');

    const total = await Expense.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching expenses'
    });
  }
};

/**
 * 🔍 Get Expense by ID
 */
export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const expense = await Expense.findById(id)
      .populate('employeeId', 'name email designation')
      .populate('approverId', 'name email')
      .populate('projectId', 'name');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Authorization check
    if (
      userRole !== 'ADMIN' &&
      userRole !== 'MANAGER' &&
      expense.employeeId._id.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this expense'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching expense'
    });
  }
};

/**
 * ✏️ Update Expense (EMPLOYEE - before approval)
 */
export const updateExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = (req as any).user.id;
    const {
      category,
      amount,
      currency,
      date,
      description,
      projectId,
      merchantName
    } = req.body;

    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check ownership
    if (expense.employeeId.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense'
      });
    }

    // Can only update pending expenses
    if (expense.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update non-pending expense'
      });
    }

    // Update fields
    if (category) expense.category = category;
    if (amount) expense.amount = Number(amount);
    if (currency) expense.currency = currency;
    if (date) expense.date = date;
    if (description) expense.description = description;
    if (projectId !== undefined) expense.projectId = projectId;
    if (merchantName !== undefined) expense.merchantName = merchantName;

    // Handle new receipt upload
    if (req.file) {
      // Delete old receipt if exists
      if (expense.receipt) {
        const oldPath = path.join(__dirname, '../../', expense.receipt);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      expense.receipt = `/uploads/${req.file.filename}`;
    }

    await expense.save();

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: expense
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating expense'
    });
  }
};

/**
 * 🗑️ Delete Expense (EMPLOYEE - before approval)
 */
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = (req as any).user.id;

    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check ownership
    if (expense.employeeId.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense'
      });
    }

    // Can only delete pending expenses
    if (expense.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete non-pending expense'
      });
    }

    // Delete receipt file if exists
    if (expense.receipt) {
      const receiptPath = path.join(__dirname, '../../', expense.receipt);
      if (fs.existsSync(receiptPath)) {
        fs.unlinkSync(receiptPath);
      }
    }

    await Expense.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting expense'
    });
  }
};

/**
 * ✅ Approve Expense (ADMIN/MANAGER)
 */
export const approveExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = (req as any).user.id;
    const approverName = (req as any).user.name || (req as any).user.email;

    const expense = await Expense.findById(id).populate('employeeId', 'name email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Expense already processed'
      });
    }

    expense.status = 'APPROVED';
    expense.approverId = approverId;
    expense.processedAt = new Date();
    await expense.save();

    // ✅ NOTIFY EMPLOYEE ABOUT APPROVAL
    await createNotification({
      userId: expense.employeeId._id.toString(),
      type: 'system',
      action: 'completed',
      title: 'Expense Approved',
      message: `Your ${expense.category} expense of ₹${expense.amount} has been approved by ${approverName}`,
      entityType: 'expense',
      entityId: expense._id.toString(),
      icon: 'check-circle',
      color: '#10b981',
      actionUrl: `/expenses/${expense._id}`
    });

    res.status(200).json({
      success: true,
      message: 'Expense approved successfully',
      data: expense
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error approving expense'
    });
  }
};

/**
 * ❌ Reject Expense (ADMIN/MANAGER)
 */
export const rejectExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = (req as any).user.id;
    const approverName = (req as any).user.name || (req as any).user.email;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const expense = await Expense.findById(id).populate('employeeId', 'name email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Expense already processed'
      });
    }

    expense.status = 'REJECTED';
    expense.approverId = approverId;
    expense.rejectionReason = rejectionReason;
    expense.processedAt = new Date();
    await expense.save();

    // ✅ NOTIFY EMPLOYEE ABOUT REJECTION
    await createNotification({
      userId: expense.employeeId._id.toString(),
      type: 'system',
      action: 'deleted',
      title: 'Expense Rejected',
      message: `Your ${expense.category} expense has been rejected by ${approverName}: ${rejectionReason}`,
      entityType: 'expense',
      entityId: expense._id.toString(),
      icon: 'x-circle',
      color: '#ef4444',
      actionUrl: `/expenses/${expense._id}`
    });

    res.status(200).json({
      success: true,
      message: 'Expense rejected successfully',
      data: expense
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error rejecting expense'
    });
  }
};

/**
 * 📊 Get All Expenses (ADMIN/MANAGER)
 */
export const getAllExpenses = async (req: Request, res: Response) => {
  try {
    const { status, category, employeeId, startDate, endDate, page = 1, limit = 10 } = req.query;

    const filter: any = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (employeeId) filter.employeeId = employeeId;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('employeeId', 'name email designation')
      .populate('approverId', 'name email')
      .populate('projectId', 'name');

    const total = await Expense.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching expenses'
    });
  }
};

/**
 * 📈 Get Expense Statistics (ADMIN/MANAGER)
 */
export const getExpenseStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const matchFilter: any = {};
    if (startDate && endDate) {
      matchFilter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const stats = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const byCategory = await Expense.aggregate([
      { $match: { ...matchFilter, status: 'APPROVED' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        byCategory
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching statistics'
    });
  }
};
