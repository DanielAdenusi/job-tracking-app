import type { UserSettings } from "../lib/accountSettings";
import type { Application } from "../types/application";
import {
	getApplicationEvents,
	getUpcomingApplicationEvents,
	type ApplicationEvent,
} from "./applicationEvents";

type NavigatorWithBadges = Navigator & {
	setAppBadge?: (contents?: number) => Promise<void>;
	clearAppBadge?: () => Promise<void>;
};

const maxTimeoutDelay = 2_147_483_647;

function defaultReminderMinutes(settings: UserSettings) {
	if (settings.reminderTiming === "one_hour") return 60;
	if (settings.reminderTiming === "three_days") return 60 * 24 * 3;

	return 60 * 24;
}

function getReminderOffsets(application: Application, settings: UserSettings) {
	if (!application.notificationsEnabled) return [];

	const offsets = [
		application.reminderLeadMinutes ?? defaultReminderMinutes(settings),
		application.secondReminderLeadMinutes,
	].filter(
		(value): value is number =>
			typeof value === "number" && Number.isFinite(value) && value >= 0,
	);

	return Array.from(new Set(offsets));
}

function isEventEnabled(event: ApplicationEvent, settings: UserSettings) {
	if (event.kind === "follow_up") return settings.followUpRemindersEnabled;
	if (event.kind === "interview") return settings.interviewRemindersEnabled;
	if (event.kind === "deadline" || event.kind === "offer_deadline") {
		return settings.deadlineRemindersEnabled;
	}

	return true;
}

function notificationBody(event: ApplicationEvent, offsetMinutes: number) {
	const timing =
		offsetMinutes === 0
			? "now"
			: offsetMinutes < 60
				? `in ${offsetMinutes} minutes`
				: offsetMinutes < 60 * 24
					? `in ${Math.round(offsetMinutes / 60)} hours`
					: `in ${Math.round(offsetMinutes / (60 * 24))} days`;

	return `${event.application.company} - ${event.title} is due ${timing}.`;
}

export function scheduleApplicationNotifications(
	applications: Application[],
	settings: UserSettings,
) {
	if (
		!settings.browserNotificationsEnabled ||
		!("Notification" in window) ||
		Notification.permission !== "granted"
	) {
		return () => undefined;
	}

	const now = Date.now();
	const timers: number[] = [];

	for (const application of applications) {
		for (const event of getApplicationEvents(application)) {
			if (!isEventEnabled(event, settings)) continue;

			for (const offsetMinutes of getReminderOffsets(
				application,
				settings,
			)) {
				const reminderAt =
					event.start.getTime() - offsetMinutes * 60 * 1000;
				const delay = reminderAt - now;

				if (delay < 0 || delay > maxTimeoutDelay) continue;

				const timer = window.setTimeout(() => {
					new Notification(event.title, {
						body: notificationBody(event, offsetMinutes),
						tag: `${event.id}:${offsetMinutes}`,
					});
				}, delay);

				timers.push(timer);
			}
		}
	}

	return () => {
		for (const timer of timers) {
			window.clearTimeout(timer);
		}
	};
}

export async function updateApplicationBadge(applications: Application[]) {
	const navigatorWithBadges = navigator as NavigatorWithBadges;

	if (!navigatorWithBadges.setAppBadge) return;

	const upcomingCount = getUpcomingApplicationEvents(applications).length;
	const unvisitedCount = applications.filter(
		(application) => !application.visitedAt,
	).length;
	const count = upcomingCount + unvisitedCount;

	try {
		if (count > 0) {
			await navigatorWithBadges.setAppBadge(count);
		} else {
			await navigatorWithBadges.clearAppBadge?.();
		}
	} catch {
		// Badging support varies by browser and install state.
	}
}
