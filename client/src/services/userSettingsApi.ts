import { apiFetch } from "../lib/api";
import {
	normalizeSettings,
	type UserSettings,
} from "../lib/accountSettings";

type UserSettingsResponse = {
	settings: Partial<UserSettings> | null;
	updatedAt?: string;
};

export async function getUserSettings() {
	const response = await apiFetch<UserSettingsResponse>("/user/settings");

	return normalizeSettings(response.settings);
}

export async function updateUserSettings(settings: UserSettings) {
	const response = await apiFetch<UserSettingsResponse>("/user/settings", {
		method: "PUT",
		body: JSON.stringify({ settings }),
	});

	return normalizeSettings(response.settings);
}
