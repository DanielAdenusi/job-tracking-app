import {
	getApplicationsByUser,
	getApplicationById,
	getApplicationsByStatus,
	createApplication,
	updateApplication,
	updateApplicationStatus,
	markApplicationVisited,
	deleteApplication,
	deleteApplicationsByUser,
} from "../services/applications.service.js";
import { extractApplicationFromUrl } from "../services/jobUrlExtractor.service.js";

import { validateApplicationInput } from "../utils/validateApplication.js";
import { APPLICATION_STATUSES } from "../constants/applicationOptions.js";

export async function getApplicationsController(req, res, next) {
	try {
		const applications = await getApplicationsByUser(req.user.id);
		res.json(applications);
	} catch (error) {
		next(error);
	}
}

export async function getApplicationController(req, res, next) {
	try {
		const application = await getApplicationById(
			req.user.id,
			req.params.id,
		);

		if (!application) {
			return res.status(404).json({
				message: "Application not found",
			});
		}

		res.json(application);
	} catch (error) {
		next(error);
	}
}

export async function getApplicationsByStatusController(req, res, next) {
	try {
		const { status } = req.params;
		const applications = await getApplicationsByStatus(req.user.id, status);
		res.json(applications);
	} catch (error) {
		next(error);
	}
}

export async function createApplicationController(req, res, next) {
	try {
		const validation = validateApplicationInput(req.body);

		if (!validation.isValid) {
			return res.status(400).json({
				message: "Validation failed",
				errors: validation.errors,
			});
		}

		const application = await createApplication(req.user.id, req.body);

		res.status(201).json(application);
	} catch (error) {
		next(error);
	}
}

export async function extractApplicationController(req, res, next) {
	try {
		const url = String(req.body?.url || "").trim();

		if (!url) {
			return res.status(400).json({
				message: "Job URL is required",
			});
		}

		const result = await extractApplicationFromUrl(url);

		res.json(result);
	} catch (error) {
		if (error.statusCode) {
			return res.status(error.statusCode).json({
				message: error.message,
			});
		}

		next(error);
	}
}

export async function updateApplicationController(req, res, next) {
	try {
		const validation = validateApplicationInput(req.body, {
			partial: true,
		});

		if (!validation.isValid) {
			return res.status(400).json({
				message: "Validation failed",
				errors: validation.errors,
			});
		}

		const application = await updateApplication(
			req.user.id,
			req.params.id,
			req.body,
		);

		if (!application) {
			return res.status(404).json({
				message: "Application not found",
			});
		}

		res.json(application);
	} catch (error) {
		next(error);
	}
}

export async function updateApplicationStatusController(req, res, next) {
	try {
		const { status } = req.body;

		if (!APPLICATION_STATUSES.includes(status)) {
			return res.status(400).json({
				message: "Invalid application status",
			});
		}

		const application = await updateApplicationStatus(
			req.user.id,
			req.params.id,
			status,
		);

		if (!application) {
			return res.status(404).json({
				message: "Application not found",
			});
		}

		res.json(application);
	} catch (error) {
		next(error);
	}
}

export async function markApplicationVisitedController(req, res, next) {
	try {
		const application = await markApplicationVisited(
			req.user.id,
			req.params.id,
		);

		if (!application) {
			return res.status(404).json({
				message: "Application not found",
			});
		}

		res.json(application);
	} catch (error) {
		next(error);
	}
}

export async function deleteApplicationController(req, res, next) {
	try {
		const deleted = await deleteApplication(req.user.id, req.params.id);

		if (!deleted) {
			return res.status(404).json({
				message: "Application not found",
			});
		}

		res.status(204).send();
	} catch (error) {
		next(error);
	}
}

export async function deleteApplicationsController(req, res, next) {
	try {
		const deletedCount = await deleteApplicationsByUser(req.user.id);

		res.json({ deletedCount });
	} catch (error) {
		next(error);
	}
}
