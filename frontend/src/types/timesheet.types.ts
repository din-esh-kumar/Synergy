// src/types/timesheet.types.ts - TIMESHEET TYPES

// Match backend: 'draft' | 'submitted' | 'approved' | 'rejected'
export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

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
  date: string; // comes as ISO string from API
  hoursWorked: number;
  // Backend field is "description", frontend form uses "taskDescription"
  description: string;
  status: TimesheetStatus;
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  rejectionReason?: string;
  submittedAt?: string | null;
  approvedAt?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimesheetFormData {
  projectId: string;
  date: string;
  hoursWorked: number;
  taskDescription: string; // sent as taskDescription, mapped to description in controller
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
