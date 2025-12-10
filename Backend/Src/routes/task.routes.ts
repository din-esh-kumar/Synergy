// backend/src/routes/task.routes.ts
import express from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller';

const router = express.Router();

// protect all task routes
router.use(authenticateToken);

router.post('/', createTask);
router.get('/', getTasks);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
