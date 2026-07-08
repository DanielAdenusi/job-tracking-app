import type { Application } from "../types/application";

export type ApplicationEventKind =
	| "follow_up"
	| "deadline"
	| "interview"
	| "offer_deadline";

export type ApplicationEvent = {
	id: string;
	kind: ApplicationEventKind;
	title: string;
	start: Date;
	isAllDay: boolean;
	location?: string;
	description: string;
	application: Application;
};

const eventLabels: Record<ApplicationEventKind, string> = {
	follow_up: "Follow up",
	deadline: "Application deadline",
	interview: "Interview",
	offer_deadline: "Offer deadline",
};

function dateOnlyAtNine(value: string) {
	const [year, month, day] = value.slice(0, 10).split("-").map(Number);

	return new Date(year, month - 1, day, 9, 0, 0);
}

function eventDescription(application: Application, label: string) {
	return [
		`${label} for ${application.role} at ${application.company}.`,
		application.jobUrl ? `Job post: ${application.jobUrl}` : null,
		application.contactEmail ? `Contact: ${application.contactEmail}` : null,
		application.notes ? `Notes: ${application.notes}` : null,
	]
		.filter(Boolean)
		.join("\n");
}

function buildEvent(
	application: Application,
	kind: ApplicationEventKind,
	value: string | null,
	options: { isAllDay: boolean; location?: string } = { isAllDay: true },
): ApplicationEvent | null {
	if (!value) return null;

	const label = eventLabels[kind];
	const start = options.isAllDay ? dateOnlyAtNine(value) : new Date(value);

	if (Number.isNaN(start.getTime())) return null;

	const event: ApplicationEvent = {
		id: `${application.id}:${kind}`,
		kind,
		title: `${label}: ${application.role} at ${application.company}`,
		start,
		isAllDay: options.isAllDay,
		description: eventDescription(application, label),
		application,
	};

	if (options.location || application.location) {
		event.location = options.location || application.location || undefined;
	}

	return event;
}

export function getApplicationEvents(application: Application) {
	return [
		buildEvent(application, "follow_up", application.followUpAt),
		buildEvent(application, "deadline", application.deadlineAt),
		buildEvent(application, "interview", application.interviewAt, {
			isAllDay: false,
			location:
				application.interviewLocation ||
				application.location ||
				application.interviewMode ||
				undefined,
		}),
		buildEvent(application, "offer_deadline", application.offerDeadlineAt),
	].filter((event): event is ApplicationEvent => Boolean(event));
}

export function getUpcomingApplicationEvents(
	applications: Application[],
	now = new Date(),
	withinDays = 14,
) {
	const end = new Date(now);
	end.setDate(end.getDate() + withinDays);

	return applications
		.flatMap(getApplicationEvents)
		.filter((event) => event.start >= now && event.start <= end)
		.sort((first, second) => first.start.getTime() - second.start.getTime());
}
