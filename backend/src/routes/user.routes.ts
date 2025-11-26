import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole
} from "../controllers/user.controller";
import { isAdmin } from "../middleware/IsAdmin";
import { authenticateJWT } from "../middleware/auth.middleware"; // JWT auth middleware

const router = express.Router();

// All routes below require authentication (employee, manager, admin)
router.use(authenticateJWT);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// Only admin can PATCH role field
router.patch("/:id/role", isAdmin, updateUserRole);

export default router;
