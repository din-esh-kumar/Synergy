// src/routes/project.routes.ts
import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addTeamMember,
} from '../controllers/project.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();

// ✅ EXACT MATCH - Your middleware structure
router.use(authMiddleware.authenticateToken);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/team', addTeamMember);

export default router;
