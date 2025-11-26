import express from 'express';
import {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  getUpcomingMeetings,
  getMonthlyMeetings,
} from '../controllers/meetings.controller';
import { authenticateJWT  } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Meeting CRUD operations
router.post('/', createMeeting);
router.get('/', getMeetings);
router.get('/upcoming', getUpcomingMeetings);
router.get('/monthly', getMonthlyMeetings);
router.get('/:id', getMeetingById);
router.put('/:id', updateMeeting);
router.delete('/:id', deleteMeeting);

export default router;
