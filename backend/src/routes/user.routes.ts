// backend/src/routes/user.routes.ts
import express from 'express';
import authenticateUser from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/IsAdmin';
import {
  // adjust these to exactly match your user.controller.ts exports
  getUser,              // for /me
  updateUser,           // for /me
  getAllUsers,
  getUserById,          // if you have this; otherwise remove the route
  createUser,
  deleteUser,
  updateUserStatus,     // if you have this; otherwise remove the route
} from '../controllers/user.controller';

const router = express.Router();

// Logged-in user endpoints (profile)
router.get('/me', authenticateUser, getUser);
router.put('/me', authenticateUser, updateUser);

// Admin-only user management
router.get('/', authenticateUser, isAdmin, getAllUsers);

router.get('/:id', authenticateUser, isAdmin, getUserById);

router.post('/', authenticateUser, isAdmin, createUser);
router.put('/:id', authenticateUser, isAdmin, updateUser);
router.delete('/:id', authenticateUser, isAdmin, deleteUser);
router.patch('/:id/status', authenticateUser, isAdmin, updateUserStatus);

export default router;
