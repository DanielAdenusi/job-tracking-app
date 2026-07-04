import { Fragment, useEffect, useState } from "react";
import {
	AlertTriangle,
	ArrowRight,
	BriefcaseBusiness,
	CalendarClock,
	Plus,
	RefreshCw,
	TrendingUp,
	Trophy,
	WifiOff,
} from "lucide-react";
import { Link } from "react-router";
import {
	applicationStatusBadgeClasses,
	applicationStatusLabels,
} from "../constants/applicationStatusStyles";
import { getDashboardStats } from "../services/dashboardApi";
import type {
	DashboardApplicationSummary,
	DashboardStats,
} from "../types/dashboard";
import { EmptyState } from "../components/ui/Surface";

function DashboardSkeleton() {
	return (
		<section className="grid gap-6 text-slate-950" aria-busy="true">
			<div className="sr-only">Loading dashboard...</div>

			<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 md:p-6">
				<div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
				<div className="mt-2 h-3 w-60 animate-pulse rounded bg-slate-100" />
				<div className="mt-5 h-14 w-36 animate-pulse rounded-lg bg-slate-200" />
				<div className="mt-6 h-2 animate-pulse rounded-full bg-slate-200" />
				<div className="mt-4 flex flex-wrap gap-3">
					{Array.from({ length: 3 }).map((_, index) => (
						<div
							key={index}
							className="h-5 w-36 animate-pulse rounded bg-slate-100"
						/>
					))}
				</div>
			</section>

			<div className="grid gap-6 xl:grid-cols-[1fr_420px]">
				<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 md:p-6">
					<div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
						<div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
						<div className="h-5 w-28 animate-pulse rounded bg-slate-100" />
					</div>
					<div className="grid gap-4">
						{Array.from({ length: 4 }).map((_, index) => (
							<div key={index} className="rounded-xl px-3 py-4">
								<div className="flex items-start justify-between gap-4">
									<div className="grid flex-1 gap-2">
										<div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
										<div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
									</div>
									<div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
								</div>
								<div className="mt-4 h-1.5 animate-pulse rounded-full bg-slate-100" />
							</div>
						))}
					</div>
				</section>

				<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 md:p-6">
					<div className="mb-4 flex items-center justify-between">
						<div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
						<div className="h-5 w-12 animate-pulse rounded bg-slate-100" />
					</div>
					<div className="grid gap-3 border-t border-slate-200 pt-5">
						{Array.from({ length: 4 }).map((_, index) => (
							<div
								key={index}
								className="flex items-center justify-between rounded-xl p-2"
							>
								<div className="flex items-center gap-4">
									<div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200" />
									<div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
								</div>
								<div className="h-8 w-20 animate-pulse rounded bg-slate-100" />
							</div>
						))}
					</div>
				</section>
			</div>

			<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 md:p-6">
				<div className="mb-4 flex items-end justify-between border-b border-slate-200 pb-4">
					<div className="grid gap-2">
						<div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
						<div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
					</div>
					<div className="h-7 w-16 animate-pulse rounded-md bg-slate-100" />
				</div>
				<div className="grid gap-4">
					{Array.from({ length: 3 }).map((_, index) => (
						<div key={index} className="rounded-xl px-3 py-4">
							<div className="flex items-start justify-between gap-4">
								<div className="grid gap-2">
									<div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
									<div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
								</div>
								<div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
							</div>
						</div>
					))}
				</div>
			</section>
		</section>
	);
}

function formatDate(value: string | null) {
	if (!value) return "No date set";

	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(value));
}

function getApplicationProgress(application: DashboardApplicationSummary) {
	switch (application.status) {
		case "wishlist":
		case "saved":
			return {
				stage: "Stage 1 of 5",
				percent: 10,
			};
		case "applied":
			return {
				stage: "Stage 2 of 5",
				percent: 25,
			};
		case "assessment":
			return {
				stage: "Stage 3 of 5",
				percent: 50,
			};
		case "interviewing":
			return {
				stage: "Stage 4 of 5",
				percent: 75,
			};
		case "offer":
			return {
				stage: "Completed",
				percent: 100,
			};
		case "rejected":
		case "withdrawn":
			return {
				stage: "Closed",
				percent: 100,
			};
	}
}

export function DashboardPage() {
	const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	async function loadDashboard() {
		try {
			setError(null);
			setIsLoading(true);
			const data = await getDashboardStats();
			setDashboard(data);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load dashboard",
			);
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		loadDashboard();
	}, []);

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	if (error || !dashboard) {
		return (
			<section className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm shadow-amber-100/50">
				<span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-amber-600 ring-1 ring-amber-200">
					<AlertTriangle size={22} strokeWidth={2.5} />
				</span>
				<h2 className="mt-4 text-lg font-extrabold text-amber-950">
					We cannot reach your job tracker right now
				</h2>
				<p className="mx-auto mt-2 max-w-2xl text-sm font-medium leading-6 text-amber-800">
					{error ||
						"The database or API is unavailable, and this browser does not have any saved application data to show yet."}
				</p>
				<button
					type="button"
					onClick={loadDashboard}
					className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
				>
					<RefreshCw size={16} strokeWidth={2.5} />
					Try again
				</button>
			</section>
		);
	}

	const activeApplications =
		dashboard.totalApplications -
		dashboard.rejectedCount -
		dashboard.offerCount;
	const responseRate =
		dashboard.totalApplications > 0
			? Math.round(
					((dashboard.interviewCount + dashboard.offerCount) /
						dashboard.totalApplications) *
						100,
				)
			: 0;
	const statCards = [
		{
			label: "Total applications",
			value: dashboard.totalApplications,
			helper: "Across all stages",
			icon: BriefcaseBusiness,
			color: "bg-slate-500 text-slate-50",
		},
		{
			label: "Active roles",
			value: Math.max(activeApplications, 0),
			helper: "Still in progress",
			icon: TrendingUp,
			color: "bg-blue-500 text-blue-50",
		},
		{
			label: "Interviews",
			value: dashboard.interviewCount,
			helper:
				dashboard.interviewCount > 0
					? "Interview stage"
					: "No interviews yet",
			icon: CalendarClock,
			color: "bg-amber-500 text-amber-50",
		},
		{
			label: "Offers",
			value: dashboard.offerCount,
			helper:
				dashboard.offerCount > 0 ? "Great progress" : "No offers yet",
			icon: Trophy,
			color: "bg-emerald-500 text-emerald-50",
		},
	];

	return (
		<section className="grid gap-6 text-slate-950">
			{dashboard.isOffline && (
				<section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm shadow-amber-100/50">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-3">
							<span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-amber-600 ring-1 ring-amber-200">
								<WifiOff size={18} strokeWidth={2.5} />
							</span>
							<div>
								<p className="font-extrabold text-amber-950">
									Showing browser-saved data
								</p>
								<p className="mt-1 text-sm font-medium text-amber-800">
									The database is not reachable. You can keep
									adding applications; new local entries will
									sync when the backend responds again.
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={loadDashboard}
							className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
						>
							<RefreshCw size={16} strokeWidth={2.5} />
							Retry
						</button>
					</div>
				</section>
			)}

			<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 md:p-6">
				<p className="text-md font-semibold text-slate-950">
					Response rate
				</p>
				<p className="text-xs font-semibold text-slate-500">
					(interviews + offers) ÷ total applications
				</p>
				<div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2">
					<p className="text-5xl font-black text-slate-950 md:text-6xl">
						{responseRate}%
					</p>
				</div>

				<div className="mt-6 h-2 rounded-full bg-slate-200">
					<div
						className="h-full rounded-full bg-lime-400"
						style={{
							width: `${Math.min(responseRate, 100)}%`,
						}}
					/>
				</div>

				<div className="mt-4 flex flex-wrap gap-x-7 gap-y-2 text-sm font-medium text-slate-500">
					<span className="inline-flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-lime-400" />
						{dashboard.offerCount} offer
						{dashboard.offerCount === 1 ? "" : "s"} achieved
					</span>
					<span className="inline-flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-amber-400" />
						{dashboard.interviewCount} interview
						{dashboard.interviewCount === 1 ? "" : "s"} scheduled
					</span>
					<span className="inline-flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-slate-300" />
						{dashboard.totalApplications} total applications
					</span>
				</div>
			</section>

			<div className="grid gap-6 xl:grid-cols-[1fr_420px]">
				<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 md:p-6 flex flex-col">
					<div className="mb-4 pb-4 flex items-center justify-between gap-4  border-b border-slate-200">
						<h2 className="font-bold text-slate-950">
							Recent applications
						</h2>
						<Link
							to="/applications/new"
							className="text-sm font-medium text-slate-500 transition hover:text-slate-950 group"
						>
							<Plus className="mr-1 inline-block h-4 w-4 transition group-hover:-translate-y-0.5" />
							Add application
						</Link>
					</div>

					{dashboard.recentApplications.length === 0 ? (
						<EmptyState>
							<p className="text-lg font-extrabold">
								No applications added yet.
							</p>
							<p className="mx-auto max-w-xl leading-7 text-slate-500 text-sm">
								Add your first application to populate this
								dashboard.
							</p>
						</EmptyState>
					) : (
						<div className="flex flex-col gap-3">
							{dashboard.recentApplications.map((application) => {
								const progress =
									getApplicationProgress(application);
								const isLastItem =
									dashboard.recentApplications.indexOf(
										application,
									) ===
									dashboard.recentApplications.length - 1;

								return (
									<Fragment key={application.id}>
										<Link
											key={application.id}
											to={`/applications/${application.id}`}
											className="-mx-3 block px-3 py-4 rounded-xl transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white  hover:shadow-sm hover:shadow-slate-200/80 hover:ring-1 hover:ring-slate-200/80"
										>
											<div className="flex items-start justify-between gap-4">
												<div>
													<p className="text-sm font-bold text-slate-700">
														{application.role}
													</p>
													<p className="mt-1 text-xs font-normal text-slate-500">
														{application.company}
														{application.location
															? ` - ${application.location}`
															: ""}
													</p>
												</div>

												<span
													className={[
														"rounded-full px-3 py-1 text-xs font-bold ring-1",
														applicationStatusBadgeClasses[
															application.status
														],
													].join(" ")}
												>
													{
														applicationStatusLabels[
															application.status
														]
													}
												</span>
											</div>

											<div className="mt-4">
												<div className="h-1 rounded-full bg-slate-100">
													<div
														className="h-full rounded-full bg-lime-400"
														style={{
															width: `${progress.percent}%`,
														}}
													/>
												</div>

												<div className="mt-2 flex items-center justify-between gap-4 text-xs font-medium text-slate-400">
													<span>
														{progress.stage}
													</span>
													<span>
														{progress.percent}%
														completed
													</span>
												</div>
											</div>
										</Link>
										{!isLastItem && (
											<hr className="border-slate-200" />
										)}
									</Fragment>
								);
							})}
						</div>
					)}
				</section>

				<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 md:p-6">
					<div className="mb-4 flex items-center justify-between gap-4">
						<h2 className="font-bold text-slate-950">Overview</h2>
						<Link
							to="/applications"
							className="text-sm font-medium text-slate-500 transition group hover:text-slate-950"
						>
							All
							<ArrowRight className="ml-1 inline-block h-4 w-4 transition group-hover:translate-x-0.5" />
						</Link>
					</div>

					<div className="border-t border-slate-200 pt-5">
						<div className="mb-4 flex justify-between px-2 text-xs font-medium text-slate-400">
							<span>Metric</span>
							<span>Count</span>
						</div>

						<div className="grid gap-3">
							{statCards.map((card) => {
								const Icon = card.icon;

								return (
									<article
										key={card.label}
										className="flex items-center justify-between gap-5 rounded-xl p-2 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-sm hover:shadow-slate-200/80 hover:ring-1 hover:ring-slate-200/80"
									>
										<div className="flex items-center gap-4">
											<span
												className={[
													"grid h-10 w-10 place-items-center rounded-lg",
													card.color,
												].join(" ")}
											>
												<Icon
													size={18}
													strokeWidth={2.5}
												/>
											</span>
											<p className="text-sm font-semibold text-slate-950">
												{card.label}
											</p>
										</div>

										<span className="text-right">
											<span className="block text-sm font-black text-slate-950">
												{card.value}
											</span>
											<span className="block text-[0.65rem] font-medium uppercase tracking-wide text-slate-400">
												{card.helper}
											</span>
										</span>
									</article>
								);
							})}
						</div>
					</div>
				</section>
			</div>

			<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 md:p-6">
				<div className="mb-4 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
					<div>
						<h2 className="font-bold text-slate-950">
							Upcoming follow-ups
						</h2>
						<p className="mt-1 text-sm text-slate-500">
							Applications you may need to chase soon.
						</p>
					</div>
					<span className="app-accent-surface app-accent-text app-accent-ring rounded-md px-2.5 py-1 text-xs font-extrabold ring-1">
						{dashboard.upcomingFollowUpCount} due
					</span>
				</div>

				{dashboard.upcomingFollowUps.length === 0 ? (
					<EmptyState>
						<p className="text-lg font-extrabold">
							No upcoming follow-ups.
						</p>
						<p className="mx-auto max-w-xl leading-7 text-slate-500 text-sm">
							Add follow-up dates to stay on top of applications.
						</p>
					</EmptyState>
				) : (
					<div className="flex flex-col gap-3 border-slate-200">
						{dashboard.upcomingFollowUps.map((application) => {
							const isLastItem =
								dashboard.upcomingFollowUps.indexOf(
									application,
								) ===
								dashboard.upcomingFollowUps.length - 1;

							return (
								<Fragment key={application.id}>
									<Link
										to={`/applications/${application.id}`}
										className="-mx-3 block rounded-xl px-3 py-4 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-sm hover:shadow-slate-200/80 hover:ring-1 hover:ring-slate-200/80"
									>
										<div className="flex items-start justify-between gap-4">
											<div>
												<p className="font-extrabold text-slate-950">
													{application.role}
												</p>
												<p className="mt-1 text-sm font-semibold text-slate-500">
													{application.company}
												</p>
											</div>

											<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
												{formatDate(
													application.followUpAt,
												)}
											</span>
										</div>
									</Link>

									{!isLastItem && (
										<hr className="border-slate-200" />
									)}
								</Fragment>
							);
						})}
					</div>
				)}
			</section>
		</section>
	);
}
