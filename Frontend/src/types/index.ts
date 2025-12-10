// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'employee' | 'manager' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  managerId?: string | null;   // ✅ NEW: Manager reference (nullable)
  createdAt: string;
  updatedAt: string;
  managedEmployeeIds?: string[];

  // Populated relationships (optional, from backend joins)
  manager?: User | null;       // ✅ NEW: The user's manager info
  subordinates?: User[];       // ✅ NEW: All users reporting to this user
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface GoogleAuthData {
  idToken: string;
}

export interface RefreshTokenData {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

// ============================================================================
// API RESPONSE WRAPPER - MATCHES YOUR BACKEND! ✅
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
}

// ============================================================================
// TIMESHEET TYPES
// ============================================================================

export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Timesheet {
  id: string;
  userId: string;
  projectId: string;
  date: string;
  hours: string | number;
  description: string;
  status: TimesheetStatus;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated fields (from API joins)
  project?: Project;
  user?: User;
  approver?: User;
}

export interface CreateTimesheetData {
  projectId: string;
  date: string | Date;
  hours: number;
  description: string;
}

export interface UpdateTimesheetData {
  projectId?: string;
  date?: string;
  hours?: number;
  description?: string;
}

export interface RejectTimesheetData {
  reason: string;
}

// ============================================================================
// EXPENSE TYPES
// ============================================================================

export type ExpenseStatus = 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected';

// Expense related types
export interface Expense {
  id: string;
  userId: string;
  date: string;
  amount: string;
  description: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  rejectionReason?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  amount: number;
  description: string;
  receipt?: File;
  date: string;
}

export interface UpdateExpenseData {
  amount?: number;
  description?: string;
  receipt?: File;
  date?: string;
}

export interface RejectExpenseData {
  reason: string;
}

// ============================================================================
// LEAVE TYPES
// ============================================================================

export type LeaveStatus = 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected';

export interface Leave {
  id: string;
  userId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: LeaveStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  // Add user information if available from API
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    managerId?: string;
  };
}



export interface LeaveType {
  id: string;
  name: string;
  code: string;
  description?: string;
  maxDays: number;
  isActive: boolean;
  hasDefaultBalance: boolean;
}

export interface CreateLeaveData {
  userId?: string;
  leaveTypeId: string; // Changed from 'type'
  startDate: string;
  endDate: string;
  reason: string;
}



export interface UpdateLeaveData {
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

export interface RejectLeaveData {
  reason: string;
}

// ============================================================================
// APPROVAL TYPES (For Manager/Admin)
// ============================================================================
export interface LeaveType {
  id: string;
  name: string;
  code: string;
  description?: string;
  maxDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description?: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveApplication {
  id: string;
  userId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  appliedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  leaveType?: LeaveType;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface LeaveBalance {
  id: string;
  userId: string;
  leaveTypeId: string;
  balance: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  leaveType?: LeaveType;
  remainingDays?: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Add to your types.ts file
export interface LeaveBalanceInitializationResult {
  leaveType: string;
  balance: number;
  status: 'created' | 'already_exists' | 'error';
  error?: string;
}

export interface UserLeaveBalanceInitializationResult {
  userId: string;
  userName: string;
  balances: LeaveBalanceInitializationResult[];
  error?: string;
}



export interface PendingItem {
  id: string;
  type: 'timesheet' | 'expense' | 'leave';
  userId: string;
  userName: string;
  description: string;
  submittedAt: string;
  // Type-specific fields
  hours?: string | number;
  amount?: string | number;
  startDate?: string;
  endDate?: string;
}

export interface ApprovalListResponse {
  timesheets: Timesheet[];
  expenses: Expense[];
  leaves: Leave[];
}

// ============================================================================
// PROFILE TYPES
// ============================================================================

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

// ============================================================================
// MESSAGE RESPONSE TYPES
// ============================================================================

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// FORM STATE TYPES
// ============================================================================

export interface FormErrors {
  [key: string]: string;
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// ============================================================================
// PAGINATION TYPES (For future use)
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// DASHBOARD STATS TYPES
// ============================================================================

export interface DashboardStats {
  pendingTimesheets: number;
  pendingExpenses: number;
  leaveBalance: number;
  pendingApprovals: number;
}

// ============================================================================
// FILE UPLOAD TYPES
// ============================================================================

export interface FileUploadData {
  file: File;
  onProgress?: (progress: number) => void;
}

export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

// ============================================================================
// EXPORT FILTER TYPES
// ============================================================================

export interface ExportFilters {
  employeeId?: string;
  managerId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}