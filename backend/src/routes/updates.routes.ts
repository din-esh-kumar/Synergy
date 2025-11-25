import { Router } from "express";
import { 
  createUpdate, 
  getUpdates, 
  getUpdateById, 
  deleteUpdate 
} from "../controllers/updates.controller";

import authenticate from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createUpdate);
router.get("/", authenticate, getUpdates);
router.get("/:id", authenticate, getUpdateById);
router.delete("/:id", authenticate, deleteUpdate);

export default router;
