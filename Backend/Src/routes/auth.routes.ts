// src/routes/auth.routes.ts - ✅ PERFECT WITH YOUR MIDDLEWARE
import { Router } from 'express';
import authController from '../controllers/auth.controller';
import authMiddleware from '../middlewares/auth.middleware';  // ✅ DEFAULT EXPORT

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.post('/refresh', authController.refresh);

// Protected routes  
router.get('/profile', authMiddleware.authenticateToken, authController.getUser);

export default router;
