import type {
	ApplicationPriority,
	ApplicationStatus,
	EmploymentType,
	WorkMode,
} from "../constants/applicationOptions";

export type Application = {
	id: string;
	userId: string;

	company: string;
	role: string;
	location: string | null;
	jobUrl: string | null;
	salary: string | null;

	status: ApplicationStatus;
	priority: ApplicationPriority;

	employmentType: EmploymentType | null;
	workMode: WorkMode | null;
	source: string | null;

	contactName: string | null;
	contactEmail: string | null;

	notes: string | null;

	appliedAt: string | null;
	followUpAt: string | null;
	deadlineAt: string | null;
	interviewAt: string | null;
	rejectedAt: string | null;
	offerDeadlineAt: string | null;

	createdAt: string;
	updatedAt: string;
};

export type CreateApplicationInput = {
	company: string;
	role: string;
	location?: string;
	jobUrl?: string;
	salary?: string;
	status?: ApplicationStatus;
	priority?: ApplicationPriority;
	employmentType?: EmploymentType | "";
	workMode?: WorkMode | "";
	source?: string;
	contactName?: string;
	contactEmail?: string;
	notes?: string;
	appliedAt?: string;
	followUpAt?: string;
	deadlineAt?: string;
	interviewAt?: string;
	rejectedAt?: string;
	offerDeadlineAt?: string;
};

export type UpdateApplicationInput = Partial<CreateApplicationInput>;
