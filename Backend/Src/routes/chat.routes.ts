// chat.routes.ts
import { Router } from "express";
import {
  sendMessage,
  getMessages,
  deleteMessage,
  editMessage,
} from "../controllers/chat.controller";
import { authenticateToken } from "../middlewares/auth.middleware"; // <-- named import

const router = Router();

// All chat routes require authentication
router.use(authenticateToken);

router.post("/message", sendMessage);
router.get("/messages", getMessages);
router.delete("/message/:messageId", deleteMessage);
router.put("/message/:messageId", editMessage);

export default router;
