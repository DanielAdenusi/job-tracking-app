import { apiFetch } from "../lib/api";

type PushSubscriptionResponse = {
	id: string;
	endpoint: string;
	created_at: string;
	updated_at: string;
};

type PushSubscriptionListResponse = {
	vapidPublicKey: string | null;
	subscriptions: PushSubscriptionResponse[];
};

function base64UrlToUint8Array(value: string) {
	const padding = "=".repeat((4 - (value.length % 4)) % 4);
	const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let index = 0; index < rawData.length; index += 1) {
		outputArray[index] = rawData.charCodeAt(index);
	}

	return outputArray;
}

async function ensureServiceWorkerRegistration() {
	if (!("serviceWorker" in navigator)) {
		throw new Error("This browser does not support service workers.");
	}

	const existingRegistration = await navigator.serviceWorker.getRegistration();

	if (existingRegistration) return existingRegistration;

	return navigator.serviceWorker.register("/service-worker.js");
}

export async function getPushSubscriptionInfo() {
	return apiFetch<PushSubscriptionListResponse>("/user/push-subscriptions");
}

export async function enablePushSubscription() {
	if (!("PushManager" in window)) {
		throw new Error("This browser does not support push notifications.");
	}

	const vapidPublicKey =
		import.meta.env.VITE_VAPID_PUBLIC_KEY ||
		(await getPushSubscriptionInfo()).vapidPublicKey;

	if (!vapidPublicKey) {
		throw new Error("Push notifications are not configured on this server.");
	}

	const registration = await ensureServiceWorkerRegistration();
	const existingSubscription =
		await registration.pushManager.getSubscription();
	const subscription =
		existingSubscription ||
		(await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: base64UrlToUint8Array(vapidPublicKey),
		}));

	await apiFetch<PushSubscriptionResponse>("/user/push-subscriptions", {
		method: "POST",
		body: JSON.stringify({
			subscription: subscription.toJSON(),
		}),
	});

	return subscription;
}

export async function disablePushSubscription() {
	if (!("serviceWorker" in navigator)) return;

	const registration = await navigator.serviceWorker.getRegistration();
	const subscription = await registration?.pushManager.getSubscription();

	if (!subscription) return;

	await apiFetch<void>("/user/push-subscriptions", {
		method: "DELETE",
		body: JSON.stringify({
			endpoint: subscription.endpoint,
		}),
	});

	await subscription.unsubscribe();
}
