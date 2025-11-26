import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
} from '../controllers/project.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// Route: /api/projects
router.route('/')
  .get(getProjects)      // Admin: All, Manager: Theirs, Employee: All (for now)
  .post(createProject);  // Admin Only (Enforced in controller)

// Route: /api/projects/:id
router.route('/:id')
  .get(getProjectById)   // Open to authenticated users
  .put(updateProject)    // Admin (All) or Manager (Own)
  .delete(deleteProject);// Admin Only

export default router;