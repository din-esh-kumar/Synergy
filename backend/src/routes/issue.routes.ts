// src/routes/issue.routes.ts
import { Router } from 'express';
import authenticateUser from '../middleware/auth.middleware';
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} from '../controllers/issue.controller';

const router = Router();

router.use(authenticateUser);

router.post('/', createIssue);
router.get('/', getIssues);
router.get('/:id', getIssueById);
router.put('/:id', updateIssue);
router.delete('/:id', deleteIssue);

export default router;
