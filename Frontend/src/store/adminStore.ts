import { create } from 'zustand';
import apiClient from '../config/api';
import type { User, Project, ApiResponse, LeaveType, Holiday, LeaveApplication, LeaveBalance, LeaveBalanceInitializationResult, UserLeaveBalanceInitializationResult } from '../types';
import { toast } from 'react-hot-toast';

interface BulkUploadProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentHoliday: string | null;
  isProcessing: boolean;
}

interface AdminState {
  // Existing state
  users: User[];
  projects: Project[];
  loading: boolean;
  error: string | null;
  updatingUserId: string | null;

  // New state for leave management
  leaveTypes: LeaveType[];
  holidays: Holiday[];
  allLeaveApplications: LeaveApplication[];
  leaveBalances: LeaveBalance[];
  loadingLeaveData: boolean;

  // Bulk upload state
  bulkUploadProgress: BulkUploadProgress;

  // Existing methods
  fetchAllUsers: () => Promise<void>;
  updateUserRole: (id: string, role: string) => Promise<void>;
  toggleUserStatus: (id: string, isActive: boolean) => Promise<void>;
  updateUserAdmin: (id: string, fields: Partial<User>) => Promise<void>;
  fetchAllProjects: () => Promise<void>;
  createProject: (data: any) => Promise<void>;
  updateProject: (id: string, data: any) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  clearError: () => void;

  // New methods for leave management
  fetchLeaveTypes: () => Promise<void>;
  createLeaveType: (data: any) => Promise<LeaveType>;
  updateLeaveType: (id: string, data: any) => Promise<LeaveType>;
  deleteLeaveType: (id: string) => Promise<void>;

  fetchHolidays: (year?: number) => Promise<void>;
  createHoliday: (data: any) => Promise<void>;
  updateHoliday: (id: string, data: any) => Promise<void>;
  deleteHoliday: (id: string) => Promise<void>;
  bulkCreateHolidays: (holidays: any[]) => Promise<{ success: number; failed: number }>; // UPDATED

  fetchAllLeaveApplications: (filters?: any) => Promise<void>;
  approveLeave: (id: string) => Promise<void>;
  rejectLeave: (id: string, reason: string) => Promise<void>;

  fetchLeaveBalances: (filters?: any) => Promise<void>;
  updateLeaveBalance: (data: { userId: string; leaveTypeId: string; balance: number; year?: number }) => Promise<void>;

  // NEW: Leave balance initialization methods
  initializeUserLeaveBalances: (userId: string, year?: number) => Promise<LeaveBalanceInitializationResult[]>;
  initializeAllUsersLeaveBalances: (year?: number) => Promise<{
    totalUsers: number;
    totalCreated: number;
    totalExisting: number;
    details: UserLeaveBalanceInitializationResult[];
  }>;

  // NEW: Bulk upload control methods
  clearBulkUploadProgress: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Existing state
  users: [],
  projects: [],
  loading: false,
  error: null,
  updatingUserId: null,

  // New state
  leaveTypes: [],
  holidays: [],
  allLeaveApplications: [],
  leaveBalances: [],
  loadingLeaveData: false,

  // Bulk upload state
  bulkUploadProgress: {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    currentHoliday: null,
    isProcessing: false
  },

  // Existing methods
  fetchAllUsers: async () => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.get<ApiResponse<User[]>>('/api/user');
      
      // ✅ Security: Remove any sensitive data from users
      const safeUsers = (response.data.data || []).map(user => {
        const safeUser = { ...user };
        // Remove sensitive fields
        if ('password' in safeUser) delete (safeUser as any).password;
        if ('passwordHash' in safeUser) delete (safeUser as any).passwordHash;
        if ('salt' in safeUser) delete (safeUser as any).salt;
        return safeUser;
      });
      
      set({ users: safeUsers, loading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch users';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  updateUserRole: async (id, role) => {
    try {
      set({ updatingUserId: id, error: null });
      const response = await apiClient.patch<ApiResponse<User>>(`/api/user/${id}`, { role });
      
      // ✅ Security: Remove sensitive data
      const safeUser = { ...response.data.data };
      if ('password' in safeUser) delete (safeUser as any).password;
      
      set((state) => ({
        users: state.users.map(u => u.id === id ? safeUser : u),
        updatingUserId: null
      }));
      
      toast.success('User role updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update role';
      set({ error: errorMessage, updatingUserId: null });
      toast.error(errorMessage);
      throw error;
    }
  },

  toggleUserStatus: async (id, isActive) => {
    try {
      set({ updatingUserId: id, error: null });
      const response = await apiClient.patch<ApiResponse<User>>(`/api/user/${id}`, { isActive });
      
      // ✅ Security: Remove sensitive data
      const safeUser = { ...response.data.data };
      if ('password' in safeUser) delete (safeUser as any).password;
      
      set((state) => ({
        users: state.users.map(u => u.id === id ? safeUser : u),
        updatingUserId: null
      }));
      
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update status';
      set({ error: errorMessage, updatingUserId: null });
      toast.error(errorMessage);
      throw error;
    }
  },

  updateUserAdmin: async (id, fields) => {
    try {
      set({ updatingUserId: id, error: null });
      
      // ✅ Security: Remove password fields if present
      const safeFields = { ...fields };
      if ('password' in safeFields) delete (safeFields as any).password;
      
      const response = await apiClient.patch(`/api/user/${id}`, safeFields);
      
      // ✅ Security: Remove sensitive data
      const safeUser = { ...response.data.data };
      if ('password' in safeUser) delete (safeUser as any).password;
      
      set((state) => ({
        users: state.users.map(u => u.id === id ? safeUser : u),
        updatingUserId: null
      }));
      
      toast.success('User updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update user';
      set({ error: errorMessage, updatingUserId: null });
      toast.error(errorMessage);
      throw error;
    }
  },

  fetchAllProjects: async () => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.get<ApiResponse<Project[]>>('/api/projects');
      set({ projects: response.data.data || [], loading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch projects';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  createProject: async (data) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.post<ApiResponse<Project>>('/api/projects', data);
      const newProject = Array.isArray(response.data.data)
        ? response.data.data[0]
        : response.data.data;
      
      set((state) => ({
        projects: [newProject, ...state.projects],
        loading: false,
      }));
      
      toast.success('Project created successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create project';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  updateProject: async (id, data) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.patch<ApiResponse<Project>>(`/api/projects/${id}`, data);
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? response.data.data : p),
        loading: false
      }));
      
      toast.success('Project updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update project';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      set({ loading: true, error: null });
      await apiClient.delete(`/api/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter(p => p.id !== id),
        loading: false
      }));
      
      toast.success('Project deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete project';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  // Leave Types Management
  fetchLeaveTypes: async () => {
    try {
      set({ loadingLeaveData: true, error: null });
      const response = await apiClient.get<ApiResponse<LeaveType[]>>('/api/leaves/admin/leave-types');
      set({ leaveTypes: response.data.data || [], loadingLeaveData: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch leave types';
      set({ error: errorMessage, loadingLeaveData: false });
      toast.error(errorMessage);
    }
  },

  createLeaveType: async (data) => {
    try {
      set({ loading: true, error: null });
      // console.log('Creating leave type:', data);
      
      const response = await apiClient.post<ApiResponse<LeaveType>>('/api/leaves/admin/leave-types', data);
      
      // console.log('Create response:', response.data);
      
      set((state) => ({
        leaveTypes: [{ ...response.data.data, hasDefaultBalance: data.hasDefaultBalance }, ...state.leaveTypes],
        loading: false
      }));
      
      toast.success('Leave type created successfully');
      return response.data.data;
    } catch (error: any) {
      // console.error('Error creating leave type:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create leave type';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  updateLeaveType: async (id, data) => {
    try {
      set({ loading: true, error: null });
      // console.log('Updating leave type:', { id, data });
      
      const response = await apiClient.patch<ApiResponse<LeaveType>>(
        `/api/leaves/admin/leave-types/${id}`, 
        data
      );
      
      // console.log('Update response:', response.data);
      
      set((state) => ({
        leaveTypes: state.leaveTypes.map(lt => 
          lt.id === id ? { ...response.data.data, hasDefaultBalance: data.hasDefaultBalance } : lt
        ),
        loading: false
      }));
      
      toast.success('Leave type updated successfully');
      return response.data.data;
    } catch (error: any) {
      // console.error('Error updating leave type:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update leave type';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  deleteLeaveType: async (id) => {
    try {
      set({ loading: true, error: null });
      await apiClient.delete(`/api/leaves/admin/leave-types/${id}`);
      set((state) => ({
        leaveTypes: state.leaveTypes.filter(lt => lt.id !== id),
        loading: false
      }));
      
      toast.success('Leave type deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete leave type';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // Holidays Management
  fetchHolidays: async (year) => {
    try {
      set({ loadingLeaveData: true, error: null });
      const params = year ? { year } : {};
      const response = await apiClient.get<ApiResponse<Holiday[]>>('/api/leaves/admin/holidays', { params });
      set({ holidays: response.data.data || [], loadingLeaveData: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch holidays';
      set({ error: errorMessage, loadingLeaveData: false });
      toast.error(errorMessage);
    }
  },

  createHoliday: async (data) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.post<ApiResponse<Holiday>>('/api/leaves/admin/holidays', data);
      set((state) => ({
        holidays: [response.data.data, ...state.holidays],
        loading: false
      }));
      
      // toast.success('Holiday created successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create holiday';
      set({ error: errorMessage, loading: false });
      // toast.error(errorMessage);
      throw error;
    }
  },

  updateHoliday: async (id, data) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.patch<ApiResponse<Holiday>>(`/api/leaves/admin/holidays/${id}`, data);
      set((state) => ({
        holidays: state.holidays.map(h => h.id === id ? response.data.data : h),
        loading: false
      }));
      
      // toast.success('Holiday updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update holiday';
      set({ error: errorMessage, loading: false });
      // toast.error(errorMessage);
      throw error;
    }
  },

  deleteHoliday: async (id) => {
    try {
      set({ loading: true, error: null });
      await apiClient.delete(`/api/leaves/admin/holidays/${id}`);
      set((state) => ({
        holidays: state.holidays.filter(h => h.id !== id),
        loading: false
      }));
      
      // toast.success('Holiday deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete holiday';
      set({ error: errorMessage, loading: false });
      // toast.error(errorMessage);
      throw error;
    }
  },

  // UPDATED: Bulk Create Holidays using individual API calls
  bulkCreateHolidays: async (holidays) => {
    set({
      bulkUploadProgress: {
        total: holidays.length,
        processed: 0,
        successful: 0,
        failed: 0,
        currentHoliday: null,
        isProcessing: true
      }
    });

    let successful = 0;
    let failed = 0;
    const newHolidays: Holiday[] = [];

    // Process holidays sequentially to avoid overwhelming the server
    for (let i = 0; i < holidays.length; i++) {
      const holiday = holidays[i];
      
      try {
        set({
          bulkUploadProgress: {
            ...get().bulkUploadProgress,
            currentHoliday: holiday.name,
            processed: i
          }
        });

        // Add a small delay between requests to be nice to the server
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const response = await apiClient.post<ApiResponse<Holiday>>('/api/leaves/admin/holidays', holiday);
        newHolidays.push(response.data.data);
        successful++;

        set({
          bulkUploadProgress: {
            ...get().bulkUploadProgress,
            processed: i + 1,
            successful
          }
        });

      } catch (error: any) {
        // console.error(`Failed to create holiday "${holiday.name}":`, error);
        failed++;

        set({
          bulkUploadProgress: {
            ...get().bulkUploadProgress,
            processed: i + 1,
            failed
          }
        });
      }
    }

    // Add all successfully created holidays to the state
    if (newHolidays.length > 0) {
      set((state) => ({
        holidays: [...newHolidays, ...state.holidays]
      }));
    }

    // Final update
    set({
      bulkUploadProgress: {
        ...get().bulkUploadProgress,
        isProcessing: false,
        currentHoliday: null
      }
    });

    // Show final result
    // if (successful > 0) {
    //   toast.success(`Successfully created ${successful} holidays${failed > 0 ? `, ${failed} failed` : ''}`);
    // } else {
    //   toast.error('Failed to create any holidays');
    // }

    return { success: successful, failed };
  },

  // Leave Applications Management
  fetchAllLeaveApplications: async (filters = {}) => {
    try {
      set({ loadingLeaveData: true, error: null });
      const response = await apiClient.get<ApiResponse<LeaveApplication[]>>('/api/leaves', {
        params: { status: 'all', ...filters }
      });
      set({ allLeaveApplications: response.data.data || [], loadingLeaveData: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch leave applications';
      set({ error: errorMessage, loadingLeaveData: false });
      toast.error(errorMessage);
    }
  },

  approveLeave: async (id) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.post<ApiResponse<LeaveApplication>>(`/api/leaves/${id}/approve`);
      set((state) => ({
        allLeaveApplications: state.allLeaveApplications.map(la => 
          la.id === id ? response.data.data : la
        ),
        loading: false
      }));
      
      toast.success('Leave application approved');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to approve leave';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  rejectLeave: async (id, reason) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.post<ApiResponse<LeaveApplication>>(`/api/leaves/${id}/reject`, { reason });
      set((state) => ({
        allLeaveApplications: state.allLeaveApplications.map(la => 
          la.id === id ? response.data.data : la
        ),
        loading: false
      }));
      
      toast.success('Leave application rejected');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reject leave';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // Leave Balances Management
  fetchLeaveBalances: async (filters = {}) => {
    try {
      set({ loadingLeaveData: true, error: null });
      // console.log('🔍 Fetching leave balances with filters:', filters);
      
      const response = await apiClient.get('/api/leaves/admin/leave-balances', {
        params: filters
      });
      
      // console.log('📦 Leave balances API response:', response.data);
      
      // Handle different response formats
      let balances = [];
      if (response.data && response.data.data) {
        balances = response.data.data;
      } else if (Array.isArray(response.data)) {
        balances = response.data;
      }
      
      // console.log(`✅ Loaded ${balances.length} leave balances`);
      
      set({ 
        leaveBalances: balances, 
        loadingLeaveData: false 
      });
      
      return balances;
      
    } catch (error: any) {
      // console.error('❌ Error fetching leave balances:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch leave balances';
      // console.error('Error details:', error.response?.data);
      
      set({ 
        error: errorMessage, 
        loadingLeaveData: false,
        leaveBalances: [] 
      });
      
      toast.error(errorMessage);
      throw error;
    }
  },

  updateLeaveBalance: async (data) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.post<ApiResponse<LeaveBalance>>('/api/leaves/admin/leave-balances', data);
      set((state) => ({
        leaveBalances: state.leaveBalances.map(lb => 
          lb.id === response.data.data.id ? response.data.data : lb
        ),
        loading: false
      }));
      
      toast.success('Leave balance updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update leave balance';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // NEW: Leave balance initialization methods
  initializeUserLeaveBalances: async (userId, year = new Date().getFullYear()) => {
    try {
      set({ loading: true, error: null });
      // console.log(`🔄 Initializing leave balances for user: ${userId}`);
      
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          user: { id: string; name: string };
          year: number;
          results: LeaveBalanceInitializationResult[];
        };
      }>('/api/leaves/admin/initialize-user-balances', {
        userId,
        year: year || new Date().getFullYear()
      });
      
      // Refresh leave balances after initialization
      await get().fetchLeaveBalances({ year: year || new Date().getFullYear() });
      
      set({ loading: false });
      
      const createdCount = response.data.data.results.filter(r => r.status === 'created').length;
      toast.success(`Created ${createdCount} leave balances for ${response.data.data.user.name}`);
      
      // console.log('✅ User leave balances initialized successfully');
      return response.data.data.results;
    } catch (error: any) {
      // console.error('❌ Error initializing user leave balances:', error);
      const errorMessage = error.response?.data?.message || 'Failed to initialize leave balances';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  initializeAllUsersLeaveBalances: async (year = new Date().getFullYear()) => {
    try {
      set({ loading: true, error: null });
      // console.log(`🔄 Initializing leave balances for ALL users`);
      
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          totalUsers: number;
          totalCreated: number;
          totalExisting: number;
          details: UserLeaveBalanceInitializationResult[];
        };
      }>('/api/leaves/admin/initialize-all-balances', {
        year: year || new Date().getFullYear()
      });
      
      // Refresh leave balances after initialization
      await get().fetchLeaveBalances({ year: year || new Date().getFullYear() });
      
      set({ loading: false });
      
      toast.success(`Initialized leave balances for ${response.data.data.totalUsers} users`);
      
      // console.log('✅ All users leave balances initialized successfully');
      return response.data.data;
    } catch (error: any) {
      // console.error('❌ Error initializing all users leave balances:', error);
      const errorMessage = error.response?.data?.message || 'Failed to initialize leave balances';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // NEW: Clear bulk upload progress
  clearBulkUploadProgress: () => {
    set({
      bulkUploadProgress: {
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        currentHoliday: null,
        isProcessing: false
      }
    });
  }
}));