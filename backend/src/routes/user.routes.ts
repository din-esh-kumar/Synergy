// src/routes/user.routes.ts
import express from "express";
import { getAllUsers, getUserById, updateUser, deleteUser } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
const router = express.Router();

router.use(authenticate);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
