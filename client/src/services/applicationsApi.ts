import { apiFetch } from "../lib/api";
import type {
	Application,
	CreateApplicationInput,
	ExtractedApplicationDraft,
	UpdateApplicationInput,
} from "../types/application";
import type { ApplicationStatus } from "../constants/applicationOptions";
import {
	clearCachedApplications,
	createCachedApplication,
	deleteCachedApplication,
	getCachedApplication,
	getCachedApplications,
	isLocalApplicationId,
	saveApplicationsSnapshot,
	syncPendingCreates,
	updateCachedApplication,
	updateCachedApplicationStatus,
	upsertCachedApplication,
} from "./applicationOfflineStore";

let lastApplicationsLoadUsedCache = false;

function createRemoteApplication(data: CreateApplicationInput) {
	return apiFetch<Application>("/applications", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export function didLastApplicationsLoadUseCache() {
	return lastApplicationsLoadUsedCache;
}

export async function getApplications() {
	try {
		lastApplicationsLoadUsedCache = false;
		const applications = await apiFetch<Application[]>("/applications");

		return syncPendingCreates(applications, createRemoteApplication);
	} catch (error) {
		const applications = getCachedApplications();

		if (applications.length > 0) {
			lastApplicationsLoadUsedCache = true;
			return applications;
		}

		throw error;
	}
}

export async function getApplication(id: string) {
	if (isLocalApplicationId(id)) {
		const application = getCachedApplication(id);

		if (application) return application;
	}

	try {
		const application = await apiFetch<Application>(`/applications/${id}`);
		upsertCachedApplication(application);
		return application;
	} catch (error) {
		const application = getCachedApplication(id);

		if (application) return application;

		throw error;
	}
}

export async function getApplicationsByStatus(status: ApplicationStatus) {
	try {
		const applications = await apiFetch<Application[]>(
			`/applications/status/${status}`,
		);
		saveApplicationsSnapshot([
			...getCachedApplications().filter(
				(application) => application.status !== status,
			),
			...applications,
		]);

		return applications;
	} catch (error) {
		const applications = getCachedApplications().filter(
			(application) => application.status === status,
		);

		if (applications.length > 0) return applications;

		throw error;
	}
}

export async function createApplication(data: CreateApplicationInput) {
	try {
		const application = await createRemoteApplication(data);
		upsertCachedApplication(application);
		return application;
	} catch (error) {
		const application = createCachedApplication(data);

		return application;
	}
}

export function extractApplicationFromUrl(url: string) {
	return apiFetch<ExtractedApplicationDraft>("/applications/extract", {
		method: "POST",
		body: JSON.stringify({ url }),
	});
}

export async function updateApplication(
	id: string,
	data: UpdateApplicationInput,
) {
	if (isLocalApplicationId(id)) {
		const application = updateCachedApplication(id, data);

		if (application) return application;
	}

	const application = await apiFetch<Application>(`/applications/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
	upsertCachedApplication(application);

	return application;
}

export async function updateApplicationStatus(
	id: string,
	status: ApplicationStatus,
) {
	if (isLocalApplicationId(id)) {
		const application = updateCachedApplicationStatus(id, status);

		if (application) return application;
	}

	const application = await apiFetch<Application>(`/applications/${id}/status`, {
		method: "PATCH",
		body: JSON.stringify({ status }),
	});
	upsertCachedApplication(application);

	return application;
}

export async function deleteApplication(id: string) {
	if (isLocalApplicationId(id)) {
		deleteCachedApplication(id);
		return;
	}

	await apiFetch<void>(`/applications/${id}`, {
		method: "DELETE",
	});
	deleteCachedApplication(id);
}

export function deleteAllApplications() {
	const result = apiFetch<{ deletedCount: number }>("/applications", {
		method: "DELETE",
	});

	result.then(() => clearCachedApplications()).catch(() => undefined);

	return result;
}
