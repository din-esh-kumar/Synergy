import express, { Request, Response } from 'express';
import { register, login } from '../controllers/auth.controller';
import { protect, adminOnly, managerOnly } from '../middleware/auth.middleware';

// Inline module augmentation to fix `req.user` error locally
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    };
  }
}

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes for Admin only
router.post('/register', register);
// router.post('/register', protect, adminOnly, register);
// Manager-only routes
router.use(protect, managerOnly);
router.get('/manager/dashboard', (req: Request, res: Response) => {
  res.json({ msg: 'Manager dashboard', userId: req.user?.id });
});

export default router;
