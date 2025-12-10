// backend/src/routes/notifications.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import {
  getNotifications,
  getStats,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  cleanupOldNotifications,
} from '../controllers/notifications.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getNotifications);
router.get('/stats', getStats);
router.put('/:notificationId/read', markAsRead);
router.put('/mark-all/read', markAllAsRead);
router.delete('/:notificationId', deleteNotification);
router.delete('/', clearAllNotifications);
router.post('/cleanup', cleanupOldNotifications);

export default router;
