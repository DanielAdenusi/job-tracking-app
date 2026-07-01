import { apiFetch } from "../../lib/api";
import type {
	ApplicationStatus,
	CreateApplicationInput,
	JobApplication,
} from "../../types/application";

export async function getApplications(): Promise<JobApplication[]> {
	return apiFetch("/applications");
}

export async function createApplication(
	input: CreateApplicationInput,
): Promise<JobApplication> {
	return apiFetch("/applications", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export async function updateApplicationStatus(
	id: string,
	status: ApplicationStatus,
): Promise<JobApplication> {
	return apiFetch(`/applications/${id}/status`, {
		method: "PATCH",
		body: JSON.stringify({ status }),
	});
}

export async function deleteApplication(id: string): Promise<void> {
	return apiFetch(`/applications/${id}`, {
		method: "DELETE",
	});
}

export async function updateApplication(
	id: string,
	input: Partial<CreateApplicationInput>,
): Promise<JobApplication> {
	return apiFetch(`/applications/${id}`, {
		method: "PUT",
		body: JSON.stringify(input),
	});
}

export async function getApplicationById(id: string): Promise<JobApplication> {
	return apiFetch(`/applications/${id}`);
}

export async function getApplicationsByStatus(
	status: ApplicationStatus,
): Promise<JobApplication[]> {
	return apiFetch(`/applications?status=${status}`);
}
