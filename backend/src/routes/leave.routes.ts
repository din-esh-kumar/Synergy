// src/routes/leave.routes.ts

import { Router } from 'express';

import {
  applyLeave,
  getMyLeaves,
  getLeaveById,
  updateLeave,
  cancelLeave,
  getLeaveBalance,
  getLeaveHistory,
} from '../controllers/leave.controller';

import {
  getAllLeaves,
  updateLeaveStatus,
  getLeaveApplications,
  getLeaveStatistics,
  createLeaveType,
  getLeaveTypes,
  updateLeaveType,
  deleteLeaveType,
  initializeAllUserLeaveBalances,
  initializeSingleUserLeaveBalances,
  getLeaveBalancesAdmin,
  updateLeaveBalanceAdmin,
  // HOLIDAYS (ADMIN)
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
  // NEW: admin overview
  getLeaveApplicationsOverview,
} from '../controllers/leave-admin.controller';

import authMiddleware from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// All leave routes require authentication
router.use(authMiddleware);

// ===== EMPLOYEE ROUTES =====
// Any authenticated user can apply for leave and view their own leaves
router.post('/apply', applyLeave);
router.get('/my-leaves', getMyLeaves);
router.get('/balance', getLeaveBalance);
router.get('/history', getLeaveHistory);

// Get/update/cancel a specific leave owned by the current user
router.get('/:id', getLeaveById);
router.put('/:id', updateLeave);
router.delete('/:id/cancel', cancelLeave);

// ===== ADMIN/MANAGER ROUTES =====
// Only ADMIN and MANAGER can access these routes
router.get('/admin/all', requireRole(['ADMIN', 'MANAGER']), getAllLeaves);

router.get(
  '/admin/applications',
  requireRole(['ADMIN', 'MANAGER']),
  getLeaveApplications,
);

router.get(
  '/admin/statistics',
  requireRole(['ADMIN', 'MANAGER']),
  getLeaveStatistics,
);

// Overview used by LeaveApplicationsOverview.tsx
router.get(
  '/admin/applications-overview',
  requireRole(['ADMIN', 'MANAGER']),
  getLeaveApplicationsOverview,
);

router.put(
  '/admin/:id/status',
  requireRole(['ADMIN', 'MANAGER']),
  updateLeaveStatus,
);

// ===== LEAVE TYPES (ADMIN) =====
// Base URL: app.use('/api/leaves', leaveRoutes)
router.post(
  '/admin/leave-types',
  requireRole(['ADMIN']),
  createLeaveType,
); // POST /api/leaves/admin/leave-types

router.get(
  '/admin/leave-types',
  requireRole(['ADMIN', 'MANAGER']),
  getLeaveTypes,
); // GET /api/leaves/admin/leave-types

router.put(
  '/admin/leave-types/:id',
  requireRole(['ADMIN']),
  updateLeaveType,
); // PUT /api/leaves/admin/leave-types/:id

router.delete(
  '/admin/leave-types/:id',
  requireRole(['ADMIN']),
  deleteLeaveType,
); // DELETE /api/leaves/admin/leave-types/:id

// ===== HOLIDAYS (ADMIN) =====
// -> /api/leaves/admin/holidays
router.get(
  '/admin/holidays',
  requireRole(['ADMIN']),
  getHolidays,
); // GET /api/leaves/admin/holidays

router.post(
  '/admin/holidays',
  requireRole(['ADMIN']),
  createHoliday,
); // POST /api/leaves/admin/holidays

router.put(
  '/admin/holidays/:holidayId',
  requireRole(['ADMIN']),
  updateHoliday,
); // PUT /api/leaves/admin/holidays/:holidayId

router.delete(
  '/admin/holidays/:holidayId',
  requireRole(['ADMIN']),
  deleteHoliday,
); // DELETE /api/leaves/admin/holidays/:holidayId

// ===== LEAVE BALANCES (ADMIN) =====
router.post(
  '/admin/balances/initialize-all',
  requireRole(['ADMIN']),
  initializeAllUserLeaveBalances,
); // POST /api/leaves/admin/balances/initialize-all

router.post(
  '/admin/balances/initialize-user/:userId',
  requireRole(['ADMIN']),
  initializeSingleUserLeaveBalances,
); // POST /api/leaves/admin/balances/initialize-user/:userId

router.get(
  '/admin/balances',
  requireRole(['ADMIN']),
  getLeaveBalancesAdmin,
); // GET /api/leaves/admin/balances

router.put(
  '/admin/balances/:balanceId',
  requireRole(['ADMIN']),
  updateLeaveBalanceAdmin,
); // PUT /api/leaves/admin/balances/:balanceId

export default router;
