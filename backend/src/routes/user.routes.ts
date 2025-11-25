import { Router } from 'express';
import { promoteToManager } from '../controllers/user.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { assignManager } from '../controllers/user.controller';

const router = Router();

// Admin can promote any employee to manager
router.patch('/:id/promote', protect, adminOnly, promoteToManager);
router.patch('/:id/assign-manager', protect, adminOnly, assignManager);
export default router;
