import { pool } from "../db/pool.js";

function normalizeSettings(settings) {
	if (!settings || Array.isArray(settings) || typeof settings !== "object") {
		return {};
	}

	return settings;
}

export async function getUserSettings(userId) {
	const result = await pool.query(
		`
    SELECT settings, updated_at
    FROM users
    WHERE id = $1
    `,
		[userId],
	);

	if (result.rows.length === 0) {
		return null;
	}

	return {
		settings: normalizeSettings(result.rows[0].settings),
		updatedAt: result.rows[0].updated_at,
	};
}

export async function updateUserSettings(userId, settings) {
	const result = await pool.query(
		`
    UPDATE users
    SET settings = $2::jsonb
    WHERE id = $1
    RETURNING settings, updated_at
    `,
		[userId, JSON.stringify(normalizeSettings(settings))],
	);

	return {
		settings: normalizeSettings(result.rows[0].settings),
		updatedAt: result.rows[0].updated_at,
	};
}
