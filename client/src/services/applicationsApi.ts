import { apiFetch } from "../lib/api";
import type {
	Application,
	CreateApplicationInput,
	UpdateApplicationInput,
} from "../types/application";
import type { ApplicationStatus } from "../constants/applicationOptions";

export function getApplications() {
	return apiFetch<Application[]>("/applications");
}

export function getApplication(id: string) {
	return apiFetch<Application>(`/applications/${id}`);
}

export async function getApplicationsByStatus(status: ApplicationStatus) {
	return apiFetch<Application[]>(`/applications/status/${status}`);
}

export function createApplication(data: CreateApplicationInput) {
	return apiFetch<Application>("/applications", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export function updateApplication(id: string, data: UpdateApplicationInput) {
	return apiFetch<Application>(`/applications/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export function updateApplicationStatus(id: string, status: ApplicationStatus) {
	return apiFetch<Application>(`/applications/${id}/status`, {
		method: "PATCH",
		body: JSON.stringify({ status }),
	});
}

export function deleteApplication(id: string) {
	return apiFetch<void>(`/applications/${id}`, {
		method: "DELETE",
	});
}
