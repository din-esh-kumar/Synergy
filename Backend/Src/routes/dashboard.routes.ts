import express from 'express';
import { getDashboardStats, getActivityFeed } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/stats', getDashboardStats);
router.get('/activity', getActivityFeed);

export default router;
