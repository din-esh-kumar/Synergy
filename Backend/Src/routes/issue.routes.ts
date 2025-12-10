// src/routes/issue.routes.ts
import { Router } from 'express';
import authenticateUser, { authenticateToken } from '../middlewares/auth.middleware';
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} from '../controllers/issue.controller';

const router = Router();

// All issue routes require an authenticated user (EMPLOYEE / MANAGER / ADMIN)
router.use(authenticateToken);

// Any authenticated user can raise, read, update, and delete issues
router.post('/', createIssue);
router.get('/', getIssues);
router.get('/:id', getIssueById);
router.put('/:id', updateIssue);
router.delete('/:id', deleteIssue);

export default router;
