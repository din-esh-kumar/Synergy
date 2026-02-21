// chat.routes.ts
import { Router } from "express";
import {
  sendMessage,
  getMessages,
  deleteMessage,
  editMessage,
} from "../controllers/chat.controller";
import authenticateJWT from "../middleware/auth.middleware";

const router = Router();

// All chat routes require authentication
router.use(authenticateJWT);

router.post("/message", sendMessage);
router.get("/messages", getMessages);
router.delete("/message/:messageId", deleteMessage);
router.put("/message/:messageId", editMessage);

export default router;
