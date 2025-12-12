// src/types/expense.types.ts - EXPENSE TYPES
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ExpenseCategory = 
  | 'TRAVEL'
  | 'FOOD'
  | 'ACCOMMODATION'
  | 'SUPPLIES'
  | 'EQUIPMENT'
  | 'TRAINING'
  | 'OTHER';

export interface Expense {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
    designation?: string;
  };
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: Date;
  description: string;
  receipt?: string;
  projectId?: {
    _id: string;
    name: string;
  };
  merchantName?: string;
  status: ExpenseStatus;
  approverId?: {
    _id: string;
    name: string;
    email: string;
  };
  rejectionReason?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseFormData {
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  description: string;
  projectId?: string;
  merchantName?: string;
  receipt?: File;
}

export interface ExpenseFilters {
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseStats {
  byStatus: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
  byCategory: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
}
