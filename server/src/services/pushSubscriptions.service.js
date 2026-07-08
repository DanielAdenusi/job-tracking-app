import webPush from "web-push";
import { pool } from "../db/pool.js";

const vapidSubject =
	process.env.VAPID_SUBJECT || process.env.CLIENT_URL || "mailto:admin@example.com";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
	webPush.setVapidDetails(
		vapidSubject,
		process.env.VAPID_PUBLIC_KEY,
		process.env.VAPID_PRIVATE_KEY,
	);
}

function hasVapidConfig() {
	return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function isPushSubscription(value) {
	return (
		value &&
		typeof value === "object" &&
		typeof value.endpoint === "string" &&
		value.keys &&
		typeof value.keys.p256dh === "string" &&
		typeof value.keys.auth === "string"
	);
}

export async function upsertPushSubscription(userId, subscription, userAgent) {
	if (!isPushSubscription(subscription)) {
		const error = new Error("Invalid push subscription");
		error.statusCode = 400;
		throw error;
	}

	const result = await pool.query(
		`
    INSERT INTO push_subscriptions (user_id, endpoint, subscription, user_agent)
    VALUES ($1, $2, $3::jsonb, $4)
    ON CONFLICT (endpoint)
    DO UPDATE SET
      user_id = EXCLUDED.user_id,
      subscription = EXCLUDED.subscription,
      user_agent = EXCLUDED.user_agent,
      updated_at = NOW()
    RETURNING id, endpoint, created_at, updated_at
    `,
		[
			userId,
			subscription.endpoint,
			JSON.stringify(subscription),
			userAgent || null,
		],
	);

	return result.rows[0];
}

export async function deletePushSubscription(userId, endpoint) {
	if (!endpoint) return false;

	const result = await pool.query(
		`
    DELETE FROM push_subscriptions
    WHERE user_id = $1
    AND endpoint = $2
    `,
		[userId, endpoint],
	);

	return result.rowCount > 0;
}

export async function getPushSubscriptionsByUser(userId) {
	const result = await pool.query(
		`
    SELECT id, endpoint, created_at, updated_at
    FROM push_subscriptions
    WHERE user_id = $1
    ORDER BY updated_at DESC
    `,
		[userId],
	);

	return result.rows;
}

export async function sendPushNotification(subscription, payload) {
	if (!hasVapidConfig()) {
		return { sent: false, reason: "missing_vapid_config" };
	}

	try {
		await webPush.sendNotification(subscription, JSON.stringify(payload));
		return { sent: true };
	} catch (error) {
		if (error.statusCode === 404 || error.statusCode === 410) {
			await pool.query(
				"DELETE FROM push_subscriptions WHERE endpoint = $1",
				[subscription.endpoint],
			);
		}

		return {
			sent: false,
			reason: error.message || "push_send_failed",
		};
	}
}
