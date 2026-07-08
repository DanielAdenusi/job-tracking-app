import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
	BriefcaseBusiness,
	CalendarClock,
	CalendarDays,
	CheckCircle2,
	MessageSquareText,
	RefreshCw,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/Surface";
import { getApplications } from "../services/applicationsApi";
import {
	getApplicationEvents,
	type ApplicationEvent,
	type ApplicationEventKind,
} from "../services/applicationEvents";
import type { Application } from "../types/application";

const eventIcons = {
	follow_up: MessageSquareText,
	deadline: CalendarDays,
	interview: CalendarClock,
	offer_deadline: CheckCircle2,
} as const;

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
	offer_deadline: "Offer deadline",
};

function formatEventDate(value: Date) {
	return new Intl.DateTimeFormat("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(value);
}

function groupEventsByDay(events: ApplicationEvent[]) {
	return events.reduce<Record<string, ApplicationEvent[]>>(
		(groups, event) => {
			const key = event.start.toISOString().slice(0, 10);

			return {
				...groups,
				[key]: [...(groups[key] || []), event],
			};
		},
		{},
	);
}

export function UpcomingPage() {
	const [applications, setApplications] = useState<Application[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	async function loadApplications() {
		try {
			setError(null);
			setIsLoading(true);
			setApplications(await getApplications());
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to load upcoming events.",
			);
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		void loadApplications();
	}, []);

	const events = useMemo(() => {
		const now = new Date();

		return applications
			.flatMap(getApplicationEvents)
			.filter((event) => event.start >= now)
			.sort(
				(first, second) =>
					first.start.getTime() - second.start.getTime(),
			);
	}, [applications]);
	const groupedEvents = groupEventsByDay(events);

	if (isLoading) {
		return (
			<section className="grid gap-6">
				<div className="h-24 animate-pulse rounded-xl bg-slate-200" />
				{Array.from({ length: 8 }).map((_, index) => (
					<div
						key={index}
						className="h-32 animate-pulse rounded-xl bg-slate-200"
					/>
				))}
			</section>
		);
	}

	return (
		<section className="grid gap-6">
			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-4">
					<p className="font-bold text-red-900">{error}</p>
				</div>
			)}

			<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-sm font-black text-slate-950">
							{events.length} upcoming events
						</p>
						<p className="mt-1 text-sm font-semibold text-slate-500">
							Follow-ups, deadlines, interviews, and offer
							decisions from every tracked application.
						</p>
					</div>
					<Button
						variant="secondary"
						tone="neutral"
						onClick={() => void loadApplications()}
					>
						<RefreshCw size={16} strokeWidth={2.4} />
						Refresh
					</Button>
				</div>
			</div>

			{events.length === 0 ? (
				<EmptyState>
					<CalendarClock
						size={34}
						strokeWidth={2.4}
						className="mx-auto text-slate-300"
					/>
					<p className="mt-3 text-lg font-extrabold">
						No upcoming events.
					</p>
					<p className="mx-auto max-w-xl text-sm leading-7 text-slate-500">
						Add follow-up dates, deadlines, interviews, or offer
						deadlines to build your schedule.
					</p>
				</EmptyState>
			) : (
				<div className="grid gap-5">
					{Object.entries(groupedEvents).map(([day, dayEvents]) => (
						<section
							key={day}
							className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40"
						>
							<header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
								<h2 className="text-sm font-black text-slate-950">
									{new Intl.DateTimeFormat("en-GB", {
										weekday: "long",
										day: "numeric",
										month: "long",
										year: "numeric",
									}).format(new Date(`${day}T12:00:00`))}
								</h2>
							</header>
							<div className="divide-y divide-slate-100">
								{dayEvents.map((event) => {
									const Icon = eventIcons[event.kind];

									return (
										<Link
											key={event.id}
											to={`/applications/${event.application.id}`}
											className="grid gap-4 p-5 transition hover:bg-slate-50 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
										>
											<span
												className={[
													"grid h-10 w-10 place-items-center rounded-lg ring-1",
													eventStyles[event.kind],
												].join(" ")}
											>
												<Icon
													size={18}
													strokeWidth={2.5}
												/>
											</span>
											<div className="min-w-0">
												<p className="font-extrabold text-slate-950">
													{event.application.role}
												</p>
												<p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
													<BriefcaseBusiness
														size={15}
														strokeWidth={2.3}
													/>
													{event.application.company}
													<span className="text-slate-300">
														/
													</span>
													{eventLabels[event.kind]}
												</p>
											</div>
											<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
												{formatEventDate(event.start)}
											</span>
										</Link>
									);
								})}
							</div>
						</section>
					))}
				</div>
			)}
		</section>
	);
}
