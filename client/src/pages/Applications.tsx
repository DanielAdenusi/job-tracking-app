import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

import {
	deleteApplication,
	getApplications,
	updateApplicationStatus,
} from "../services/applicationsApi";

import {
	APPLICATION_PRIORITIES,
	APPLICATION_STATUSES,
	type ApplicationPriority,
	type ApplicationStatus,
} from "../constants/applicationOptions";

import type { Application } from "../types/application";

type StatusFilter = "all" | ApplicationStatus;
type PriorityFilter = "all" | ApplicationPriority;
type SortOption =
	| "newest"
	| "oldest"
	| "company_az"
	| "company_za"
	| "follow_up"
	| "priority";

const statusBadgeClasses: Record<ApplicationStatus, string> = {
	wishlist: "bg-slate-100 text-slate-700",
	saved: "bg-blue-100 text-blue-700",
	applied: "bg-indigo-100 text-indigo-700",
	assessment: "bg-purple-100 text-purple-700",
	interviewing: "bg-amber-100 text-amber-700",
	offer: "bg-emerald-100 text-emerald-700",
	rejected: "bg-red-100 text-red-700",
	withdrawn: "bg-zinc-100 text-zinc-700",
};

const priorityBadgeClasses: Record<ApplicationPriority, string> = {
	low: "bg-slate-100 text-slate-700",
	medium: "bg-blue-100 text-blue-700",
	high: "bg-red-100 text-red-700",
};

const priorityRank: Record<ApplicationPriority, number> = {
	high: 3,
	medium: 2,
	low: 1,
};

function formatOption(value: string) {
	return value
		.split("_")
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
}

function formatDate(value: string | null) {
	if (!value) return "No date";

	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(value));
}

function applicationMatchesSearch(
	application: Application,
	searchTerm: string,
) {
	const query = searchTerm.trim().toLowerCase();

	if (!query) return true;

	const searchableText = [
		application.company,
		application.role,
		application.location,
		application.notes,
		application.source,
		application.contactName,
		application.contactEmail,
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	return searchableText.includes(query);
}

export function ApplicationsPage() {
	const [applications, setApplications] = useState<Application[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
	const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const [searchParams, setSearchParams] = useSearchParams();

	function getInitialStatusFilter(): StatusFilter {
		const status = searchParams.get("status");

		if (APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
			return status as ApplicationStatus;
		}

		return "all";
	}

	function getInitialPriorityFilter(): PriorityFilter {
		const priority = searchParams.get("priority");

		if (APPLICATION_PRIORITIES.includes(priority as ApplicationPriority)) {
			return priority as ApplicationPriority;
		}

		return "all";
	}

	function getInitialSortOption(): SortOption {
		const sort = searchParams.get("sort");

		if (
			sort === "newest" ||
			sort === "oldest" ||
			sort === "company_az" ||
			sort === "company_za" ||
			sort === "follow_up" ||
			sort === "priority"
		) {
			return sort;
		}

		return "newest";
	}

	const [searchTerm, setSearchTerm] = useState(
		() => searchParams.get("q") || "",
	);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>(
		getInitialStatusFilter,
	);
	const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>(
		getInitialPriorityFilter,
	);
	const [sortOption, setSortOption] =
		useState<SortOption>(getInitialSortOption);

	useEffect(() => {
		async function loadApplications() {
			try {
				setError(null);
				const data = await getApplications();
				setApplications(data);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to load applications",
				);
			} finally {
				setIsLoading(false);
			}
		}

		loadApplications();
	}, []);

	useEffect(() => {
		const params = new URLSearchParams();

		if (searchTerm.trim()) {
			params.set("q", searchTerm.trim());
		}

		if (statusFilter !== "all") {
			params.set("status", statusFilter);
		}

		if (priorityFilter !== "all") {
			params.set("priority", priorityFilter);
		}

		if (sortOption !== "newest") {
			params.set("sort", sortOption);
		}

		setSearchParams(params, {
			replace: true,
		});
	}, [searchTerm, statusFilter, priorityFilter, sortOption, setSearchParams]);

	const filteredApplications = useMemo(() => {
		const filtered = applications.filter((application) => {
			const matchesSearch = applicationMatchesSearch(
				application,
				searchTerm,
			);

			const matchesStatus =
				statusFilter === "all" || application.status === statusFilter;

			const matchesPriority =
				priorityFilter === "all" ||
				application.priority === priorityFilter;

			return matchesSearch && matchesStatus && matchesPriority;
		});

		return [...filtered].sort((a, b) => {
			switch (sortOption) {
				case "oldest":
					return (
						new Date(a.createdAt).getTime() -
						new Date(b.createdAt).getTime()
					);

				case "company_az":
					return a.company.localeCompare(b.company);

				case "company_za":
					return b.company.localeCompare(a.company);

				case "follow_up": {
					const aTime = a.followUpAt
						? new Date(a.followUpAt).getTime()
						: Number.MAX_SAFE_INTEGER;

					const bTime = b.followUpAt
						? new Date(b.followUpAt).getTime()
						: Number.MAX_SAFE_INTEGER;

					return aTime - bTime;
				}

				case "priority":
					return priorityRank[b.priority] - priorityRank[a.priority];

				case "newest":
				default:
					return (
						new Date(b.createdAt).getTime() -
						new Date(a.createdAt).getTime()
					);
			}
		});
	}, [applications, searchTerm, statusFilter, priorityFilter, sortOption]);

	const stats = useMemo(() => {
		return {
			total: applications.length,
			visible: filteredApplications.length,
			interviewing: applications.filter((app) =>
				["assessment", "interviewing"].includes(app.status),
			).length,
			offers: applications.filter((app) => app.status === "offer").length,
		};
	}, [applications, filteredApplications]);

	async function handleStatusChange(
		applicationId: string,
		nextStatus: ApplicationStatus,
	) {
		const previousApplications = applications;

		try {
			setError(null);
			setIsUpdatingId(applicationId);

			setApplications((current) =>
				current.map((application) =>
					application.id === applicationId
						? {
								...application,
								status: nextStatus,
							}
						: application,
				),
			);

			const updatedApplication = await updateApplicationStatus(
				applicationId,
				nextStatus,
			);

			setApplications((current) =>
				current.map((application) =>
					application.id === applicationId
						? updatedApplication
						: application,
				),
			);
		} catch (err) {
			setApplications(previousApplications);
			setError(
				err instanceof Error
					? err.message
					: "Failed to update application",
			);
		} finally {
			setIsUpdatingId(null);
		}
	}

	async function handleDelete(application: Application) {
		const confirmed = window.confirm(
			`Delete ${application.role} at ${application.company}?`,
		);

		if (!confirmed) return;

		const previousApplications = applications;

		try {
			setError(null);
			setIsDeletingId(application.id);

			setApplications((current) =>
				current.filter((item) => item.id !== application.id),
			);

			await deleteApplication(application.id);
		} catch (err) {
			setApplications(previousApplications);
			setError(
				err instanceof Error
					? err.message
					: "Failed to delete application",
			);
		} finally {
			setIsDeletingId(null);
		}
	}

	function resetFilters() {
		setSearchTerm("");
		setStatusFilter("all");
		setPriorityFilter("all");
		setSortOption("newest");
	}

	return (
		<section className="grid gap-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div>
					<h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
						Applications
					</h2>
					<p className="mt-2 max-w-2xl leading-7 text-slate-600">
						Search, filter, update, and manage every role you are
						tracking.
					</p>
				</div>

				<Link
					to="/applications/new"
					className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
				>
					Add application
				</Link>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<p className="text-sm font-bold text-slate-500">Total</p>
					<p className="mt-2 text-3xl font-extrabold">
						{stats.total}
					</p>
				</article>

				<article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<p className="text-sm font-bold text-slate-500">Showing</p>
					<p className="mt-2 text-3xl font-extrabold">
						{stats.visible}
					</p>
				</article>

				<article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<p className="text-sm font-bold text-slate-500">
						Interview stage
					</p>
					<p className="mt-2 text-3xl font-extrabold">
						{stats.interviewing}
					</p>
				</article>

				<article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<p className="text-sm font-bold text-slate-500">Offers</p>
					<p className="mt-2 text-3xl font-extrabold">
						{stats.offers}
					</p>
				</article>
			</div>

			<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="grid gap-4 xl:grid-cols-[1fr_190px_190px_190px_auto] xl:items-end">
					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Search
						</span>
						<input
							type="search"
							value={searchTerm}
							onChange={(event) =>
								setSearchTerm(event.target.value)
							}
							placeholder="Search company, role, location, notes..."
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Status
						</span>
						<select
							value={statusFilter}
							onChange={(event) =>
								setStatusFilter(
									event.target.value as StatusFilter,
								)
							}
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						>
							<option value="all">All statuses</option>
							{APPLICATION_STATUSES.map((status) => (
								<option key={status} value={status}>
									{formatOption(status)}
								</option>
							))}
						</select>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Priority
						</span>
						<select
							value={priorityFilter}
							onChange={(event) =>
								setPriorityFilter(
									event.target.value as PriorityFilter,
								)
							}
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						>
							<option value="all">All priorities</option>
							{APPLICATION_PRIORITIES.map((priority) => (
								<option key={priority} value={priority}>
									{formatOption(priority)}
								</option>
							))}
						</select>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Sort
						</span>
						<select
							value={sortOption}
							onChange={(event) =>
								setSortOption(event.target.value as SortOption)
							}
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						>
							<option value="newest">Newest first</option>
							<option value="oldest">Oldest first</option>
							<option value="company_az">Company A-Z</option>
							<option value="company_za">Company Z-A</option>
							<option value="follow_up">Follow-up date</option>
							<option value="priority">Priority</option>
						</select>
					</label>
					<button
						type="button"
						onClick={resetFilters}
						className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
					>
						Reset
					</button>
				</div>
			</div>

			{error && (
				<div className="rounded-3xl border border-red-200 bg-red-50 p-5">
					<p className="font-bold text-red-900">{error}</p>
				</div>
			)}

			{isLoading && (
				<div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
					<div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
					<p className="mt-4 font-bold text-slate-700">
						Loading applications...
					</p>
				</div>
			)}

			{!isLoading && applications.length === 0 && (
				<div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
					<h3 className="text-lg font-extrabold">
						No applications yet
					</h3>
					<p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">
						Add your first job application to start tracking your
						job search.
					</p>

					<Link
						to="/applications/new"
						className="mt-5 inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
					>
						Add application
					</Link>
				</div>
			)}

			{!isLoading &&
				applications.length > 0 &&
				filteredApplications.length === 0 && (
					<div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
						<h3 className="text-lg font-extrabold">
							No matching applications
						</h3>
						<p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">
							Try changing your search, filters, or sorting
							option.
						</p>

						<button
							type="button"
							onClick={resetFilters}
							className="mt-5 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
						>
							Clear filters
						</button>
					</div>
				)}

			{!isLoading && filteredApplications.length > 0 && (
				<div className="grid gap-4">
					{filteredApplications.map((application) => (
						<article
							key={application.id}
							className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
						>
							<div className="grid gap-5 xl:grid-cols-[1fr_220px_180px_auto] xl:items-center">
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<span
											className={[
												"rounded-full px-3 py-1 text-xs font-extrabold",
												statusBadgeClasses[
													application.status
												],
											].join(" ")}
										>
											{formatOption(application.status)}
										</span>

										<span
											className={[
												"rounded-full px-3 py-1 text-xs font-extrabold",
												priorityBadgeClasses[
													application.priority
												],
											].join(" ")}
										>
											{formatOption(application.priority)}
										</span>
									</div>

									<h3 className="mt-3 truncate text-lg font-extrabold text-slate-950">
										{application.role}
									</h3>

									<p className="mt-1 text-sm font-semibold text-slate-500">
										{application.company}
										{application.location
											? ` · ${application.location}`
											: ""}
									</p>

									<div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
										<span>
											Applied:{" "}
											<strong className="text-slate-700">
												{formatDate(
													application.appliedAt,
												)}
											</strong>
										</span>

										<span>
											Follow-up:{" "}
											<strong className="text-slate-700">
												{formatDate(
													application.followUpAt,
												)}
											</strong>
										</span>
									</div>
								</div>

								<label className="grid gap-2">
									<span className="text-xs font-bold uppercase tracking-wide text-slate-500">
										Update status
									</span>
									<select
										value={application.status}
										disabled={
											isUpdatingId === application.id
										}
										onChange={(event) =>
											handleStatusChange(
												application.id,
												event.target
													.value as ApplicationStatus,
											)
										}
										className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{APPLICATION_STATUSES.map((status) => (
											<option key={status} value={status}>
												{formatOption(status)}
											</option>
										))}
									</select>
								</label>

								<div className="grid gap-2 text-sm">
									{application.jobUrl ? (
										<a
											href={application.jobUrl}
											target="_blank"
											rel="noreferrer"
											className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 font-bold text-slate-700 transition hover:bg-slate-100"
										>
											Open job
										</a>
									) : (
										<span className="inline-flex h-11 items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 font-bold text-slate-400">
											No job link
										</span>
									)}

									<Link
										to={`/applications/${application.id}`}
										className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 font-bold text-slate-700 transition hover:bg-slate-100"
									>
										View details
									</Link>
									<Link
										to={`/applications/${application.id}/edit`}
										className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 font-bold text-slate-700 transition hover:bg-slate-100"
									>
										Edit
									</Link>
								</div>

								<button
									type="button"
									disabled={isDeletingId === application.id}
									onClick={() => handleDelete(application)}
									className="h-11 rounded-2xl border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{isDeletingId === application.id
										? "Deleting..."
										: "Delete"}
								</button>
							</div>
						</article>
					))}
				</div>
			)}
		</section>
	);
}
