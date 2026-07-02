import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";

import {
	getApplicationsController,
	getApplicationController,
	getApplicationsByStatusController,
	createApplicationController,
	updateApplicationController,
	updateApplicationStatusController,
	deleteApplicationController,
	deleteApplicationsController,
} from "../controllers/applications.controller.js";

const router = express.Router();

router.use(requireAuth);

// GET /api/applications
// Gets all applications for the logged-in user
router.get("/", getApplicationsController);

// GET /api/applications/:id
// Gets a specific application for the logged-in user
router.get("/:id", getApplicationController);

// GET /api/applications/status/:status
// Gets all applications for the logged-in user with a specific status
router.get("/status/:status", getApplicationsByStatusController);

// POST /api/applications
// Creates a new application for the logged-in user
router.post("/", createApplicationController);

// DELETE /api/applications
// Deletes all applications for the logged-in user
router.delete("/", deleteApplicationsController);

// PATCH /api/applications/:id/status
// Update the status of a specific application for the logged-in user
router.patch("/:id/status", updateApplicationStatusController);

// PATCH /api/applications/:id
// Updates an existing application for the logged-in user
router.patch("/:id", updateApplicationController);

// DELETE /api/applications/:id
// Deletes an existing application for the logged-in user
router.delete("/:id", deleteApplicationController);

export default router;
