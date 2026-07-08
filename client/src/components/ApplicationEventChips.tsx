import { CalendarClock, CalendarDays, MessageSquareText } from "lucide-react";
import type { Application } from "../types/application";
import {
	getApplicationEvents,
	type ApplicationEventKind,
} from "../services/applicationEvents";

const eventStyles: Record<ApplicationEventKind, string> = {
	follow_up: "bg-amber-50 text-amber-700 ring-amber-200",
	deadline: "bg-rose-50 text-rose-700 ring-rose-200",
	interview: "bg-violet-50 text-violet-700 ring-violet-200",
	offer_deadline: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const eventLabels: Record<ApplicationEventKind, string> = {
	follow_up: "Follow-up",
	deadline: "Deadline",
	interview: "Interview",
	offer_deadline: "Offer",
};

const eventIcons = {
	follow_up: MessageSquareText,
	deadline: CalendarDays,
	interview: CalendarClock,
	offer_deadline: CalendarDays,
} as const;

function formatChipDate(value: Date) {
	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(value);
}

export function ApplicationEventChips({
	application,
	limit = 3,
}: {
	application: Application;
	limit?: number;
}) {
	const events = getApplicationEvents(application)
		.filter((event) => event.start >= new Date())
		.sort((first, second) => first.start.getTime() - second.start.getTime())
		.slice(0, limit);

	if (events.length === 0) return null;

	return (
		<div className="mt-3 flex flex-wrap gap-2">
			{events.map((event) => {
				const Icon = eventIcons[event.kind];

				return (
					<span
						key={event.id}
						className={[
							"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-bold ring-1",
							eventStyles[event.kind],
						].join(" ")}
					>
						<Icon size={12} strokeWidth={2.5} />
						{eventLabels[event.kind]} {formatChipDate(event.start)}
					</span>
				);
			})}
		</div>
	);
}
