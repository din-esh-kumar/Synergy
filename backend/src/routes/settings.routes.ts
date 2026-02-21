// src/routes/settings.routes.ts
import { Router } from "express";
import authenticateJWT from "../middleware/auth.middleware";
import settingsController from "../controllers/settings.controller";

const router = Router();

router.use(authenticateJWT);

router.get("/", settingsController.getSettings);
router.patch("/notifications", settingsController.updateNotifications);
router.patch("/theme", settingsController.updateTheme);
router.patch("/profile", settingsController.updateProfile);

export default router;
