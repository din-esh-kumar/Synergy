// backend/src/routes/project.routes.ts
import express from 'express';
import authenticateUser from '../middleware/auth.middleware';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addTeamMember,
} from '../controllers/project.controller';

const router = express.Router();

// authenticate all project routes
router.use(authenticateUser);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/team', addTeamMember);

export default router;
