import express from "express";
import authenticateUser from "../middleware/auth.middleware";
import { isAdmin } from "../middleware/IsAdmin";
import {
  getUser,          // /me
  updateUser,       // /me
  getAllUsers,
  getUserById,
  createUser,
  deleteUser,
  updateUserStatus,
} from "../controllers/user.controller";

const router = express.Router();

// Profile
router.get("/me", authenticateUser, getUser);
router.put("/me", authenticateUser, updateUser);

// NON‑ADMIN list, used by Meetings/Teams
router.get("/", authenticateUser, getAllUsers);

// ADMIN management – will be mounted under /api/admin/users
router.get("/manage", authenticateUser, isAdmin, getAllUsers);
router.get("/manage/:id", authenticateUser, isAdmin, getUserById);
router.post("/manage", authenticateUser, isAdmin, createUser);
router.put("/manage/:id", authenticateUser, isAdmin, updateUser);
router.delete("/manage/:id", authenticateUser, isAdmin, deleteUser);
router.patch(
  "/manage/:id/status",
  authenticateUser,
  isAdmin,
  updateUserStatus
);

export default router;
