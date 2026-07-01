export const APPLICATION_STATUSES = [
	"wishlist",
	"saved",
	"applied",
	"assessment",
	"interviewing",
	"offer",
	"rejected",
	"withdrawn",
] as const;

export const APPLICATION_PRIORITIES = ["low", "medium", "high"] as const;

export const EMPLOYMENT_TYPES = [
	"full_time",
	"part_time",
	"internship",
	"placement",
	"contract",
	"temporary",
	"freelance",
] as const;

export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type ApplicationPriority = (typeof APPLICATION_PRIORITIES)[number];
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type WorkMode = (typeof WORK_MODES)[number];
