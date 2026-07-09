import { apiFetch } from "../lib/api";
import type { Application } from "../types/application";
import type { DashboardStats } from "../types/dashboard";
import { getCachedApplications } from "./applicationOfflineStore";
import { getApplicationEvents } from "./applicationEvents";

function toDashboardSummary(application: Application) {
	return {
		id: application.id,
		company: application.company,
		role: application.role,
		status: application.status,
		priority: application.priority,
		location: application.location,
		followUpAt: application.followUpAt,
		createdAt: application.createdAt,
	};
}

function buildCachedDashboardStats(
	applications: Application[],
): DashboardStats {
	const now = new Date();
	const sevenDaysFromNow = new Date(now);
	sevenDaysFromNow.setDate(now.getDate() + 7);

	const upcomingFollowUps = applications
		.filter((application) => {
			if (!application.followUpAt) return false;

			const followUpDate = new Date(application.followUpAt);

			return followUpDate >= now && followUpDate <= sevenDaysFromNow;
		})
		.sort(
			(a, b) =>
				new Date(a.followUpAt || "").getTime() -
				new Date(b.followUpAt || "").getTime(),
		)
		.slice(0, 5)
		.map(toDashboardSummary);
	const reminderDigest = applications
		.flatMap((application) =>
			getApplicationEvents(application).map((event) => ({
				...toDashboardSummary(application),
				eventKind: event.kind,
				eventAt: event.start.toISOString(),
			})),
		)
		.filter((event) => new Date(event.eventAt) >= now)
		.sort(
			(first, second) =>
				new Date(first.eventAt).getTime() -
				new Date(second.eventAt).getTime(),
		)
		.slice(0, 5);

	return {
		totalApplications: applications.length,
		appliedCount: applications.filter(
			(application) => application.status === "applied",
		).length,
		interviewCount: applications.filter(
			(application) =>
				application.status === "assessment" ||
				application.status === "interviewing",
		).length,
		offerCount: applications.filter(
			(application) => application.status === "offer",
		).length,
		rejectedCount: applications.filter(
			(application) => application.status === "rejected",
		).length,
		upcomingFollowUpCount: upcomingFollowUps.length,
		overdueFollowUpCount: applications.filter((application) => {
			if (!application.followUpAt) return false;

			return new Date(application.followUpAt) < now;
		}).length,
		recentApplications: [...applications]
			.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() -
					new Date(a.createdAt).getTime(),
			)
			.slice(0, 5)
			.map(toDashboardSummary),
		upcomingFollowUps,
		reminderDigest,
		isOffline: true,
	};
}

export async function getDashboardStats() {
	try {
		return await apiFetch<DashboardStats>("/dashboard/stats");
	} catch (error) {
		const cachedApplications = getCachedApplications();

		if (cachedApplications.length > 0) {
			return buildCachedDashboardStats(cachedApplications);
		}

		throw error;
	}
}
