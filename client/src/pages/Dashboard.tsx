import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getDashboardStats } from "../services/dashboardApi";
import type { DashboardStats } from "../types/dashboard";

function formatDate(value: string | null) {
	if (!value) return "No date set";

	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(value));
}

export function DashboardPage() {
	const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadDashboard() {
			try {
				setError(null);
				const data = await getDashboardStats();
				setDashboard(data);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to load dashboard",
				);
			} finally {
				setIsLoading(false);
			}
		}

		loadDashboard();
	}, []);

	if (isLoading) {
		return (
			<section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
				<div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
				<p className="mt-4 font-bold text-slate-700">
					Loading dashboard...
				</p>
			</section>
		);
	}

	if (error || !dashboard) {
		return (
			<section className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
				<h2 className="text-lg font-extrabold text-red-900">
					Dashboard failed to load
				</h2>
				<p className="mt-2 text-red-700">{error}</p>
			</section>
		);
	}

	const statCards = [
		{
			label: "Total applications",
			value: dashboard.totalApplications,
		},
		{
			label: "Applied",
			value: dashboard.appliedCount,
		},
		{
			label: "Interviews",
			value: dashboard.interviewCount,
		},
		{
			label: "Offers",
			value: dashboard.offerCount,
		},
		{
			label: "Rejected",
			value: dashboard.rejectedCount,
		},
		{
			label: "Upcoming follow-ups",
			value: dashboard.upcomingFollowUpCount,
		},
		{
			label: "Overdue follow-ups",
			value: dashboard.overdueFollowUpCount,
		},
	];

	return (
		<section className="grid gap-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div>
					<h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
						Dashboard
					</h2>
					<p className="mt-2 max-w-2xl leading-7 text-slate-600">
						Your live job search overview, powered by your
						PostgreSQL application data.
					</p>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row">
					<Link
						to="/kanban"
						className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
					>
						View Kanban
					</Link>

					<Link
						to="/applications/new"
						className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
					>
						Add application
					</Link>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{statCards.map((card) => (
					<article
						key={card.label}
						className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
					>
						<p className="text-sm font-bold text-slate-500">
							{card.label}
						</p>
						<p className="mt-2 text-3xl font-extrabold">
							{card.value}
						</p>
					</article>
				))}
			</div>

			<div className="grid gap-6 xl:grid-cols-2">
				<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h3 className="text-lg font-extrabold">
								Recent applications
							</h3>
							<p className="mt-1 text-sm text-slate-500">
								The latest roles you added.
							</p>
						</div>

						<Link
							to="/applications"
							className="text-sm font-bold text-blue-700 hover:underline"
						>
							View all
						</Link>
					</div>

					{dashboard.recentApplications.length === 0 ? (
						<div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-center">
							<p className="font-bold text-slate-700">
								No applications added yet.
							</p>
							<p className="mt-1 text-sm text-slate-500">
								Add your first application to populate this
								dashboard.
							</p>
						</div>
					) : (
						<div className="mt-5 grid gap-3">
							{dashboard.recentApplications.map((application) => (
								<Link
									key={application.id}
									to={`/applications/${application.id}`}
									className="rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
								>
									<div className="flex items-start justify-between gap-4">
										<div>
											<p className="font-extrabold text-slate-950">
												{application.role}
											</p>
											<p className="mt-1 text-sm text-slate-500">
												{application.company}
												{application.location
													? ` · ${application.location}`
													: ""}
											</p>
										</div>

										<span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
											{application.status}
										</span>
									</div>
								</Link>
							))}
						</div>
					)}
				</section>

				<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<div>
						<h3 className="text-lg font-extrabold">
							Upcoming follow-ups
						</h3>
						<p className="mt-1 text-sm text-slate-500">
							Applications you may need to chase soon.
						</p>
					</div>

					{dashboard.upcomingFollowUps.length === 0 ? (
						<div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-center">
							<p className="font-bold text-slate-700">
								No upcoming follow-ups.
							</p>
							<p className="mt-1 text-sm text-slate-500">
								Add follow-up dates to stay on top of
								applications.
							</p>
						</div>
					) : (
						<div className="mt-5 grid gap-3">
							{dashboard.upcomingFollowUps.map((application) => (
								<Link
									key={application.id}
									to={`/applications/${application.id}`}
									className="rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
								>
									<div className="flex items-start justify-between gap-4">
										<div>
											<p className="font-extrabold text-slate-950">
												{application.role}
											</p>
											<p className="mt-1 text-sm text-slate-500">
												{application.company}
											</p>
										</div>

										<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
											{formatDate(application.followUpAt)}
										</span>
									</div>
								</Link>
							))}
						</div>
					)}
				</section>
			</div>
		</section>
	);
}
