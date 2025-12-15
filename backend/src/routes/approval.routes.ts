// src/routes/approval.routes.ts - SYNERGY ALIGNED
import { Router } from 'express';
import {
  getPendingApprovals,
  approveRequest,
  rejectRequest,
} from '../controllers/approval.controller';
import authMiddleware from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// All approval routes require authentication first
router.use(authMiddleware);

// Only ADMIN and MANAGER can access approvals
// GET /api/approvals/pending?type=leaves|expenses|timesheets|all
router.get(
  '/pending',
  requireRole(['ADMIN', 'MANAGER']),
  getPendingApprovals,
);

// Approve a specific item
// PUT /api/approvals/:type/:id/approve
// :type = 'leave' | 'expense' | 'timesheet'
router.put(
  '/:type/:id/approve',
  requireRole(['ADMIN', 'MANAGER']),
  approveRequest,
);

// Reject a specific item
// PUT /api/approvals/:type/:id/reject
router.put(
  '/:type/:id/reject',
  requireRole(['ADMIN', 'MANAGER']),
  rejectRequest,
);

export default router;
