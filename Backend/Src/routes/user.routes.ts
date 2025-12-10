// src/routes/user.routes.ts
import { Router } from 'express';
import {
  getUser,
  updateProfile,
  getAllUsers,
  getUserById,
  createUser,
  deleteUser,
  updateUserStatus,
  updateUser,
  assignRole,
} from '../controllers/user.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/rbac.middleware';

const router = Router();

// ✅ FIXED - Use .authenticateToken (your middleware structure)
router.use(authMiddleware.authenticateToken);

router.get('/me', getUser);
router.patch('/me', updateProfile);

router.get('/', getAllUsers);

router.get('/manage', isAdmin, getAllUsers);
router.get('/manage/:id', isAdmin, getUserById);
router.post('/manage', isAdmin, createUser);
router.patch('/manage/:id', isAdmin, updateUser);
router.delete('/manage/:id', isAdmin, deleteUser);
router.patch('/manage/:id/status', isAdmin, updateUserStatus);
router.patch('/manage/:id/role', isAdmin, assignRole);

router.get('/profile', getUser);
router.patch('/profile', updateProfile);
router.patch('/:id', isAdmin, updateUser);

export default router;
