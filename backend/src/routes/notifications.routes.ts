// backend/src/routes/notifications.routes.ts

import { Router } from 'express';
import auth from '../middleware/auth.middleware';
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
router.use(auth);

/**
 * GET /api/notifications
 * Get all notifications for the current user
 * Query params: limit (default 50), skip (default 0)
 */
router.get('/', getNotifications);

/**
 * GET /api/notifications/stats
 * Get notification statistics for the current user
 */
router.get('/stats', getStats);

/**
 * PUT /api/notifications/:notificationId/read
 * Mark a single notification as read
 */
router.put('/:notificationId/read', markAsRead);

/**
 * PUT /api/notifications/mark-all/read
 * Mark all notifications as read
 */
router.put('/mark-all/read', markAllAsRead);

/**
 * DELETE /api/notifications/:notificationId
 * Delete a single notification
 */
router.delete('/:notificationId', deleteNotification);

/**
 * DELETE /api/notifications
 * Clear all notifications for the current user
 */
router.delete('/', clearAllNotifications);

/**
 * POST /api/notifications/cleanup
 * Cleanup old notifications (admin only – controller should enforce)
 */
router.post('/cleanup', cleanupOldNotifications);

export default router;
