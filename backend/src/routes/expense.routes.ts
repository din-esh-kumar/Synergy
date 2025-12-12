// src/routes/expense.routes.ts - SYNERGY ALIGNED
import { Router } from 'express';
import { upload } from '../config/multerConfig';
import {
  createExpense,
  getMyExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} from '../controllers/expense.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// All expense routes require authentication
router.use(authMiddleware);

// ===== EMPLOYEE ROUTES =====
router.post('/', upload.single('receipt'), createExpense);
router.get('/my-expenses', getMyExpenses);
router.get('/:id', getExpenseById);
router.put('/:id', upload.single('receipt'), updateExpense);
router.delete('/:id', deleteExpense);

// ===== ADMIN/MANAGER ROUTES =====
router.get('/admin/all', requireRole(['ADMIN', 'MANAGER']), getMyExpenses);
router.put('/admin/:id/approve', requireRole(['ADMIN', 'MANAGER']), updateExpense);
router.put('/admin/:id/reject', requireRole(['ADMIN', 'MANAGER']), updateExpense);

export default router;
