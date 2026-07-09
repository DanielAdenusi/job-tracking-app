import {
	deletePushSubscription,
	getPushSubscriptionsByUser,
	upsertPushSubscription,
} from "../services/pushSubscriptions.service.js";

export async function getPushSubscriptionsController(req, res, next) {
	try {
		const subscriptions = await getPushSubscriptionsByUser(req.user.id);

		res.json({
			vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null,
			subscriptions,
		});
	} catch (error) {
		next(error);
	}
}

export async function upsertPushSubscriptionController(req, res, next) {
	try {
		const subscription = await upsertPushSubscription(
			req.user.id,
			req.body?.subscription,
			req.headers["user-agent"],
		);

		res.status(201).json(subscription);
	} catch (error) {
		if (error.statusCode) {
			return res.status(error.statusCode).json({
				message: error.message,
			});
		}

		next(error);
	}
}

export async function deletePushSubscriptionController(req, res, next) {
	try {
		await deletePushSubscription(req.user.id, req.body?.endpoint);

		res.status(204).send();
	} catch (error) {
		next(error);
	}
}
