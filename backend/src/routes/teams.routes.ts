import { Router } from "express";
import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  updateTeamMembers,
  assignProjectsToTeam,
  assignTasksToTeam,
} from "../controllers/team.controller";
import authMiddleware from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// All team routes require authentication
router.use(authMiddleware);

// Allow only ADMIN and MANAGER
router.post("/", requireRole(["ADMIN", "MANAGER"]), createTeam);
router.get("/", requireRole(["ADMIN", "MANAGER"]), getTeams);
router.get("/:id", requireRole(["ADMIN", "MANAGER"]), getTeamById);
router.put("/:id", requireRole(["ADMIN", "MANAGER"]), updateTeam);
router.delete("/:id", requireRole(["ADMIN", "MANAGER"]), deleteTeam);

router.put(
  "/:id/members",
  requireRole(["ADMIN", "MANAGER"]),
  updateTeamMembers
);
router.put(
  "/:id/projects",
  requireRole(["ADMIN", "MANAGER"]),
  assignProjectsToTeam
);
router.put(
  "/:id/tasks",
  requireRole(["ADMIN", "MANAGER"]),
  assignTasksToTeam
);

export default router;
