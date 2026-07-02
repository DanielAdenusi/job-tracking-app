import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
	getUserSettingsController,
	updateUserSettingsController,
} from "../controllers/userSettings.controller.js";

const router = express.Router();

router.use(requireAuth);

router.get("/settings", getUserSettingsController);
router.put("/settings", updateUserSettingsController);

export default router;
