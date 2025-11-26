import { Router } from 'express';
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask
} from '../controllers/task.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// 1. Protect all routes
router.use(protect);

// Route: /api/tasks
router.route('/')
  // GET: All roles can view tasks (Controller handles filtering)
  .get(getTasks)
  
  // POST: Only Admin and Manager can create tasks
  .post(authorize('ADMIN', 'MANAGER'), createTask);

// Route: /api/tasks/:id
router.route('/:id')
  // PUT: All roles can update (Controller handles restrictions)
  .put(updateTask)
  
  // DELETE: Only Admin and Manager can delete
  .delete(authorize('ADMIN', 'MANAGER'), deleteTask);

export default router;