import { Router } from "express";
import { createIssue, getIssues, updateIssue, deleteIssue } from "../controllers/issue.controller";
import authenticate from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createIssue);
router.get("/", authenticate, getIssues);
router.put("/:id", authenticate, updateIssue);
router.delete("/:id", authenticate, deleteIssue);

export default router;
