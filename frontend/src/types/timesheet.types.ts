// src/types/timesheet.types.ts - TIMESHEET TYPES
export type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Timesheet {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
    designation?: string;
  };
  projectId: {
    _id: string;
    name: string;
  };
  date: Date;
  hoursWorked: number;
  taskDescription: string;
  status: TimesheetStatus;
  approverId?: {
    _id: string;
    name: string;
    email: string;
  };
  rejectionReason?: string;
  submittedAt?: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimesheetFormData {
  projectId: string;
  date: string;
  hoursWorked: number;
  taskDescription: string;
}

export interface TimesheetFilters {
  status?: TimesheetStatus;
  projectId?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
