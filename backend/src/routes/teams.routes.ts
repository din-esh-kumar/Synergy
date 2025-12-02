// src/routes/team.routes.ts
import { Router } from 'express';
import authenticateUser from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/IsAdmin';
import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
} from '../controllers/team.controller';

const router = Router();

router.use(authenticateUser);

router.post('/', isAdmin, createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.put('/:id', isAdmin, updateTeam);
router.delete('/:id', isAdmin, deleteTeam);

export default router;
