// src/routes/leave.routes.ts - SYNERGY ALIGNED
import { Router } from 'express';
import {
  applyLeave,
  getMyLeaves,
  getLeaveById,
  updateLeave,
  cancelLeave,
  getLeaveBalance,
  getLeaveHistory
} from '../controllers/leave.controller';
import {
  getAllLeaves,
  updateLeaveStatus,
  getLeaveApplications,
  getLeaveStatistics
} from '../controllers/leave-admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// All leave routes require authentication (matches Synergy pattern)
router.use(authMiddleware);

// ===== EMPLOYEE ROUTES =====
// Any authenticated user can apply for leave and view their own leaves
router.post('/apply', applyLeave);
router.get('/my-leaves', getMyLeaves);
router.get('/balance', getLeaveBalance);
router.get('/history', getLeaveHistory);
router.get('/:id', getLeaveById);
router.put('/:id', updateLeave);
router.delete('/:id/cancel', cancelLeave);

// ===== ADMIN/MANAGER ROUTES =====
// Only ADMIN and MANAGER can access these routes (Synergy role pattern)
router.get('/admin/all', requireRole(['ADMIN', 'MANAGER']), getAllLeaves);
router.get('/admin/applications', requireRole(['ADMIN', 'MANAGER']), getLeaveApplications);
router.get('/admin/statistics', requireRole(['ADMIN', 'MANAGER']), getLeaveStatistics);
router.put('/admin/:id/status', requireRole(['ADMIN', 'MANAGER']), updateLeaveStatus);

export default router;
