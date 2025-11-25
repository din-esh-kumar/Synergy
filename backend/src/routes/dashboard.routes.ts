import express from 'express';
import { getDashboardStats, getActivityFeed } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/activity', getActivityFeed);

export default router;
