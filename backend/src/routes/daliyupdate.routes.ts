import { Router } from 'express';
import {
  createDailyUpdate,
  getDailyUpdates,
  reviewDailyUpdate
} from '../controllers/dailyUpdate.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// 1. Protect all routes
router.use(protect);

// Route: /api/daily-updates
router.route('/')
  // GET: Manager (My Team's Updates), Employee (My Updates)
  // We allow both roles; controller handles filtering.
  .get(getDailyUpdates)
  
  // POST: Only Employees submit updates
  .post(authorize('EMPLOYEE'), createDailyUpdate);

// Route: /api/daily-updates/:id/review
// PATCH: Only Managers review updates
router.patch('/:id/review', authorize('MANAGER'), reviewDailyUpdate);

export default router;