import { Router } from "express";
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} from "../controllers/user.controller";

import authenticate from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getAllUsers);
router.get("/:id", authenticate, getUserById);
router.put("/:id", authenticate, updateUser);
router.delete("/:id", authenticate, deleteUser);

export default router;
