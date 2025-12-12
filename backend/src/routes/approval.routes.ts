// src/routes/approval.routes.ts - SYNERGY ALIGNED
import { Router } from 'express';
import {
  getPendingApprovals,
  approveRequest,
  rejectRequest
} from '../controllers/approval.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(authMiddleware);

// Only ADMIN and MANAGER can access approvals
router.get('/pending', requireRole(['ADMIN', 'MANAGER']), getPendingApprovals);
router.put('/:type/:id/approve', requireRole(['ADMIN', 'MANAGER']), approveRequest);
router.put('/:type/:id/reject', requireRole(['ADMIN', 'MANAGER']), rejectRequest);

export default router;
