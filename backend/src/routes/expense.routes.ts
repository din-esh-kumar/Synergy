// src/routes/expense.routes.ts - SYNERGY ALIGNED

import { Router } from 'express';
import { upload } from '../config/multerConfig';
import authMiddleware from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import {
  createExpense,
  getMyExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  getAllExpenses,
  getExpenseStats,
} from '../controllers/expense.controller';

const router = Router();

// All expense routes require authentication
router.use(authMiddleware);

/**
 * EMPLOYEE ROUTES
 */
router.post('/', upload.single('receipt'), createExpense);
router.get('/my-expenses', getMyExpenses);
router.get('/:id', getExpenseById);
router.put('/:id', upload.single('receipt'), updateExpense);
router.delete('/:id', deleteExpense);

/**
 * ADMIN / MANAGER ROUTES
 */
router.get(
  '/admin/all',
  requireRole(['ADMIN', 'MANAGER']),
  getAllExpenses
);

router.get(
  '/admin/stats',
  requireRole(['ADMIN', 'MANAGER']),
  getExpenseStats
);

router.put(
  '/admin/:id/approve',
  requireRole(['ADMIN', 'MANAGER']),
  approveExpense
);

router.put(
  '/admin/:id/reject',
  requireRole(['ADMIN', 'MANAGER']),
  rejectExpense
);

export default router;
