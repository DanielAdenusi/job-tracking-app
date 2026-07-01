export type ApplicationStatus =
	| "saved"
	| "applied"
	| "interviewing"
	| "offer"
	| "rejected"
	| "withdrawn";

export type JobApplication = {
	id: string;
	user_id: string;
	company: string;
	role: string;
	location: string | null;
	job_url: string | null;
	salary: string | null;
	status: ApplicationStatus;
	notes: string | null;
	applied_at: string | null;
	follow_up_at: string | null;
	created_at: string;
	updated_at: string;
};

export type CreateApplicationInput = {
	company: string;
	role: string;
	location?: string;
	jobUrl?: string;
	salary?: string;
	status?: ApplicationStatus;
	notes?: string;
	appliedAt?: string;
	followUpAt?: string;
};
