import type {
	ApplicationPriority,
	ApplicationStatus,
} from "../constants/applicationOptions";

export type DashboardApplicationSummary = {
	id: string;
	company: string;
	role: string;
	status: ApplicationStatus;
	priority: ApplicationPriority;
	location: string | null;
	followUpAt: string | null;
	createdAt: string;
};

export type DashboardStats = {
	totalApplications: number;
	appliedCount: number;
	interviewCount: number;
	offerCount: number;
	rejectedCount: number;
	upcomingFollowUpCount: number;
	overdueFollowUpCount: number;
	recentApplications: DashboardApplicationSummary[];
	upcomingFollowUps: DashboardApplicationSummary[];
};
