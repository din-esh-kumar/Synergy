// src/types/leave.types.ts - LEAVE TYPES
// src/types/leave.types.ts
export type LeaveStatus = 'submitted' | 'approved' | 'rejected' | 'draft';

// Codes used when applying for leave
export type LeaveType =
  | 'SICK'
  | 'CASUAL'
  | 'EARNED'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'UNPAID';

export type LeaveTypeCode = LeaveType;


// Main Leave type used on the frontend
export interface Leave {
  _id: string;

  // In DB this is userId; populated as full user object
  userId: {
    _id: string;
    name: string;
    email: string;
    designation?: string;
  };

  // When coming from some admin endpoints you may still get a denormalized code
  leaveTypeId?: string;        // ObjectId as string
  leaveTypeCode?: LeaveTypeCode;

  startDate: string;           // ISO string (stored as string in model)
  endDate: string;             // ISO string
  duration: number;
  halfDay?: boolean;
  reason?: string;

  status: LeaveStatus;

  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;

  appliedAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  processedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

// Leave balance per user / type / year
export interface LeaveBalance {
  _id: string;
  userId: string;              // matches LeaveBalance.model.ts
  leaveTypeId: string;         // ObjectId of LeaveType
  year: number;
  balance: number;             // remaining balance
  // optional helpers if your API returns them
  total?: number;
  used?: number;
}

// Form data used when employee applies for leave
export interface LeaveFormData {
  leaveType: LeaveTypeCode;    // code like 'SICK'
  startDate: string;           // ISO or yyyy-mm-dd
  endDate: string;
  reason: string;
  halfDay: boolean;
}

// Filters used by hooks and admin UI
export interface LeaveFilters {
  status?: LeaveStatus;
  year?: number;
  userId?: string;
  leaveTypeId?: string;
}

// Statistics returned by admin endpoints
export interface LeaveStats {
  byStatus: Array<{
    _id: LeaveStatus;
    count: number;
    totalDays: number;
  }>;
  byType: Array<{
    _id: string;              // leaveTypeId
    count: number;
    totalDays: number;
  }>;
}
