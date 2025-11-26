import { Router } from 'express';
import {
  createWeeklyReport,
  getWeeklyReports,
  getWeeklyReportById,
  updateWeeklyReport,
  deleteWeeklyReport
} from '../controllers/weeklyUpdate.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// 1. Protect all routes
router.use(protect);

// Route: /api/weekly-reports
router.route('/')
  // GET: Managers (Own), Admins (All/Submitted) - Employees blocked
  .get(authorize('MANAGER', 'ADMIN'), getWeeklyReports)
  
  // POST: Only Managers create reports
  .post(authorize('MANAGER'), createWeeklyReport);

// Route: /api/weekly-reports/:id
router.route('/:id')
  // GET: Managers (Own), Admins (All)
  .get(authorize('MANAGER', 'ADMIN'), getWeeklyReportById)
  
  // PUT: Managers (Own Drafts Only - enforced in controller)
  .put(authorize('MANAGER'), updateWeeklyReport)
  
  // DELETE: Managers (Own Drafts), Admins (Any)
  .delete(authorize('MANAGER', 'ADMIN'), deleteWeeklyReport);

export default router;