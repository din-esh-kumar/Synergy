// src/routes/timesheet.routes.ts - SYNERGY ALIGNED
import { Router } from 'express';
import {
  createTimesheet,
  getMyTimesheets,
  getTimesheetById,
  updateTimesheet,
  deleteTimesheet,
  submitTimesheet
} from '../controllers/timesheet.controller';
import { authMiddleware } from '../middleware/auth.middleware';
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
router.get('/admin/all', requireRole(['ADMIN', 'MANAGER']), getMyTimesheets);
router.put('/admin/:id/approve', requireRole(['ADMIN', 'MANAGER']), updateTimesheet);

export default router;
