import express from 'express';
import {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  getUpcomingMeetings,
  getMonthlyMeetings,
  createInstantMeeting,
  createLinkOnlyMeeting,
  joinMeeting,
  leaveMeeting,
} from '../controllers/meetings.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Scheduled / normal meeting CRUD
router.post('/', createMeeting);
router.get('/', getMeetings);
router.get('/upcoming', getUpcomingMeetings);
router.get('/monthly', getMonthlyMeetings);
router.get('/:id', getMeetingById);
router.put('/:id', updateMeeting);
router.delete('/:id', deleteMeeting);

// Google‑Meet style extras (wire up once controller functions exist)
router.post('/instant', createInstantMeeting);      // Start an instant meeting
router.post('/link', createLinkOnlyMeeting);        // Create meeting link for later
router.post('/:id/join', joinMeeting);              // Mark user joined, emit socket
router.post('/:id/leave', leaveMeeting);            // Mark user left, emit socket


export default router;
