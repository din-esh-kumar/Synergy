// src/types/leave.types.ts - LEAVE TYPES
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type LeaveType = 'SICK' | 'CASUAL' | 'EARNED' | 'MATERNITY' | 'PATERNITY' | 'UNPAID';

export interface Leave {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
    designation?: string;
  };
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  duration: number;
  halfDay: boolean;
  reason: string;
  status: LeaveStatus;
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

export interface LeaveBalance {
  _id: string;
  employeeId: string;
  leaveType: LeaveType;
  year: number;
  total: number;
  used: number;
  balance: number;
}

export interface LeaveFormData {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  halfDay: boolean;
}

export interface LeaveFilters {
  status?: LeaveStatus;
  year?: number;
  employeeId?: string;
  leaveType?: LeaveType;
}

export interface LeaveStats {
  byStatus: Array<{
    _id: string;
    count: number;
    totalDays: number;
  }>;
  byType: Array<{
    _id: string;
    count: number;
    totalDays: number;
  }>;
}
