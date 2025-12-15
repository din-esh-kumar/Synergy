// src/routes/timesheet.routes.ts
import { Router } from 'express';
import {
  createTimesheet,
  getMyTimesheets,
  getTimesheetById,
  updateTimesheet,
  deleteTimesheet,
  submitTimesheet,
  getAllTimesheets,
  approveTimesheet,
  rejectTimesheet,
} from '../controllers/timesheet.controller';
import authMiddleware from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(authMiddleware);

// ===== EMPLOYEE ROUTES =====
router.post('/', createTimesheet);
router.get('/my-timesheets', getMyTimesheets);
router.get('/:id', getTimesheetById);
router.put('/:id', updateTimesheet);
router.delete('/:id', deleteTimesheet);
router.post('/:id/submit', submitTimesheet);

// ===== ADMIN/MANAGER ROUTES =====
router.get('/admin/all', requireRole(['ADMIN', 'MANAGER']), getAllTimesheets);
router.put(
  '/admin/:id/approve',
  requireRole(['ADMIN', 'MANAGER']),
  approveTimesheet
);
router.put(
  '/admin/:id/reject',
  requireRole(['ADMIN', 'MANAGER']),
  rejectTimesheet
);

export default router;
