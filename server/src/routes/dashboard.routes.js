import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getDashboardStatsController } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.use(requireAuth);

router.get("/stats", getDashboardStatsController);

export default router;
