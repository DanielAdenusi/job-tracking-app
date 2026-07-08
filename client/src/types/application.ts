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
	hoursPerWeek: string | null;
	jobReferenceId: string | null;
	jobDescription: JobDescriptionSections;

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
	interviewLocation: string | null;
	interviewMode: WorkMode | null;
	rejectedAt: string | null;
	offerDeadlineAt: string | null;
	reminderLeadMinutes: number | null;
	secondReminderLeadMinutes: number | null;
	notificationsEnabled: boolean;
	visitedAt: string | null;

	statusTransitions: ApplicationStatusTransition[];

	createdAt: string;
	updatedAt: string;
};

export type ApplicationStatusTransition = {
	status: ApplicationStatus;
	transitionedAt: string;
};

export type JobDescriptionSections = {
	role: string[];
	keyResponsibilities: string[];
	lookingFor: string[];
	desirable: string[];
	whyJoinUs: string[];
};

export type CreateApplicationInput = {
	company: string;
	role: string;
	location?: string;
	jobUrl?: string;
	salary?: string;
	hoursPerWeek?: string;
	jobReferenceId?: string;
	jobDescription?: JobDescriptionSections;
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
	interviewLocation?: string;
	interviewMode?: WorkMode | "";
	rejectedAt?: string;
	offerDeadlineAt?: string;
	reminderLeadMinutes?: number | "";
	secondReminderLeadMinutes?: number | "";
	notificationsEnabled?: boolean;
};

export type UpdateApplicationInput = Partial<CreateApplicationInput>;

export type ExtractedApplicationDraft = {
	application: Partial<CreateApplicationInput>;
	message: string;
};
