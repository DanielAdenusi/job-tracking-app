import {
	getUserSettings,
	updateUserSettings,
} from "../services/userSettings.service.js";

export async function getUserSettingsController(req, res, next) {
	try {
		const result = await getUserSettings(req.user.id);

		if (!result) {
			return res.status(404).json({
				message: "User settings not found",
			});
		}

		res.json(result);
	} catch (error) {
		next(error);
	}
}

export async function updateUserSettingsController(req, res, next) {
	try {
		if (
			!req.body?.settings ||
			Array.isArray(req.body.settings) ||
			typeof req.body.settings !== "object"
		) {
			return res.status(400).json({
				message: "Settings must be a JSON object",
			});
		}

		const result = await updateUserSettings(req.user.id, req.body.settings);

		res.json(result);
	} catch (error) {
		next(error);
	}
}
