import { useEffect, useMemo, useState } from "react";
import {
	Building2,
	CalendarDays,
	Clock3,
	ExternalLink,
	MapPin,
	Pencil,
	Trash2,
} from "lucide-react";
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
import {
	applicationStatusBadgeClasses,
	applicationStatusLabels,
} from "../constants/applicationStatusStyles";
import { applicationPriorityBadgeClasses } from "../constants/applicationPriorityStyles";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { Button, ButtonLink } from "../components/ui/Button";
import { IconButton, IconButtonLink } from "../components/ui/IconButton";
import { EmptyState, Spinner } from "../components/ui/Surface";
import { SearchInput, Select } from "../components/ui/FormControls";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { loadLocalSettings, tableRowOptions } from "../lib/accountSettings";

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

const priorityRank: Record<ApplicationPriority, number> = {
	high: 3,
	medium: 2,
	low: 1,
};

function getInitialPageSize() {
	return loadLocalSettings().defaultTableRows;
}

function getStatusFilterFromParams(
	searchParams: URLSearchParams,
): StatusFilter {
	const status = searchParams.get("status");

	if (APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
		return status as ApplicationStatus;
	}

	return "all";
}

function getPriorityFilterFromParams(
	searchParams: URLSearchParams,
): PriorityFilter {
	const priority = searchParams.get("priority");

	if (APPLICATION_PRIORITIES.includes(priority as ApplicationPriority)) {
		return priority as ApplicationPriority;
	}

	return "all";
}

function isSortOption(value: string): value is SortOption {
	return (
		value === "newest" ||
		value === "oldest" ||
		value === "company_az" ||
		value === "company_za" ||
		value === "follow_up" ||
		value === "priority"
	);
}

function getSortOptionFromParams(searchParams: URLSearchParams): SortOption {
	const sort = searchParams.get("sort");

	if (sort && isSortOption(sort)) {
		return sort;
	}

	const defaultSort = loadLocalSettings().defaultSort;

	return isSortOption(defaultSort) ? defaultSort : "newest";
}

function formatOption(value: string) {
	return value
		.split("_")
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
}

function formatDate(value: string | null) {
	if (!value) return "-";

	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(value));
}

function formatRelativeDate(value: string | null) {
	if (!value) return "Not applied";

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) return "Not applied";

	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.max(0, Math.floor(diffMs / 86_400_000));

	if (diffDays === 0) return "Applied today";
	if (diffDays === 1) return "Applied yesterday";
	return `Applied ${diffDays} days ago`;
}

function getTrackingDate(application: Application) {
	if (application.followUpAt) {
		return {
			label: "Follow-up",
			value: formatDate(application.followUpAt),
		};
	}

	if (application.deadlineAt) {
		return {
			label: "Deadline",
			value: formatDate(application.deadlineAt),
		};
	}

	return {
		label: "Follow-up",
		value: "No follow-up",
	};
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
	const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pageSize, setPageSize] = useState(getInitialPageSize);
	const [currentPage, setCurrentPage] = useState(1);

	const [searchParams, setSearchParams] = useSearchParams();

	const [searchTerm, setSearchTerm] = useState(
		() => searchParams.get("q") || "",
	);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
		getStatusFilterFromParams(searchParams),
	);
	const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>(() =>
		getPriorityFilterFromParams(searchParams),
	);
	const [sortOption, setSortOption] = useState<SortOption>(() =>
		getSortOptionFromParams(searchParams),
	);
	const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);

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
		const nextSearchTerm = searchParams.get("q") || "";
		const nextStatusFilter = getStatusFilterFromParams(searchParams);
		const nextPriorityFilter = getPriorityFilterFromParams(searchParams);
		const nextSortOption = getSortOptionFromParams(searchParams);

		setSearchTerm(nextSearchTerm);
		setStatusFilter(nextStatusFilter);
		setPriorityFilter(nextPriorityFilter);
		setSortOption(nextSortOption);
	}, [searchParams]);

	useEffect(() => {
		const params = new URLSearchParams();

		if (debouncedSearchTerm.trim()) {
			params.set("q", debouncedSearchTerm.trim());
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
	}, [
		debouncedSearchTerm,
		statusFilter,
		priorityFilter,
		sortOption,
		setSearchParams,
	]);

	const filteredApplications = useMemo(() => {
		const filtered = applications.filter((application) => {
			const matchesSearch = applicationMatchesSearch(
				application,
				debouncedSearchTerm,
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
	}, [
		applications,
		debouncedSearchTerm,
		statusFilter,
		priorityFilter,
		sortOption,
	]);

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

	const totalPages = Math.max(
		1,
		Math.ceil(filteredApplications.length / pageSize),
	);
	const paginatedApplications = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredApplications.slice(start, start + pageSize);
	}, [currentPage, filteredApplications, pageSize]);

	useEffect(() => {
		setCurrentPage(1);
	}, [
		debouncedSearchTerm,
		statusFilter,
		priorityFilter,
		sortOption,
		pageSize,
	]);

	useEffect(() => {
		setCurrentPage((page) => Math.min(page, totalPages));
	}, [totalPages]);

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
			window.dispatchEvent(new Event("applications:changed"));
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

	async function confirmDelete() {
		if (!deleteTarget) return;

		const previousApplications = applications;
		const application = deleteTarget;

		try {
			setError(null);
			setIsDeletingId(application.id);

			setApplications((current) =>
				current.filter((item) => item.id !== application.id),
			);

			await deleteApplication(application.id);
			window.dispatchEvent(new Event("applications:changed"));
		} catch (err) {
			setApplications(previousApplications);
			setError(
				err instanceof Error
					? err.message
					: "Failed to delete application",
			);
		} finally {
			setIsDeletingId(null);
			setDeleteTarget(null);
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
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
					<p className="text-sm font-semibold text-slate-500">
						Total Applications
					</p>
					<p className="mt-3 text-3xl font-black text-slate-950">
						{stats.total}
					</p>
				</article>

				<article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
					<p className="text-sm font-semibold text-slate-500">
						Showing Results
					</p>
					<p className="mt-3 text-3xl font-black text-slate-950">
						{stats.visible}
					</p>
				</article>

				<article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
					<p className="text-sm font-semibold text-slate-500">
						Interview Stage
					</p>
					<p className="mt-3 text-3xl font-black text-slate-950">
						{stats.interviewing}
					</p>
				</article>

				<article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
					<p className="text-sm font-semibold text-slate-500">
						Total Offers
					</p>
					<p className="mt-3 text-3xl font-black text-slate-950">
						{stats.offers}
					</p>
				</article>
			</div>

			<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
				<div className="grid gap-4 xl:grid-cols-[1fr_160px_160px_160px_auto] xl:items-end">
					<label className="grid gap-2">
						<span className="text-sm font-semibold text-slate-950">
							Search
						</span>
						<SearchInput
							value={searchTerm}
							onChange={setSearchTerm}
							onClear={() => setSearchTerm("")}
							placeholder="Search company, role, location..."
							className="font-medium"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-semibold text-slate-950">
							Status
						</span>
						<Select
							value={statusFilter}
							onChange={(event) =>
								setStatusFilter(
									event.target.value as StatusFilter,
								)
							}
						>
							<option value="all">All statuses</option>
							{APPLICATION_STATUSES.map((status) => (
								<option key={status} value={status}>
									{formatOption(status)}
								</option>
							))}
						</Select>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-semibold text-slate-950">
							Priority
						</span>
						<Select
							value={priorityFilter}
							onChange={(event) =>
								setPriorityFilter(
									event.target.value as PriorityFilter,
								)
							}
						>
							<option value="all">All priorities</option>
							{APPLICATION_PRIORITIES.map((priority) => (
								<option key={priority} value={priority}>
									{formatOption(priority)}
								</option>
							))}
						</Select>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-semibold text-slate-950">
							Sort
						</span>
						<Select
							value={sortOption}
							onChange={(event) =>
								setSortOption(event.target.value as SortOption)
							}
						>
							<option value="newest">Newest first</option>
							<option value="oldest">Oldest first</option>
							<option value="company_az">Company A-Z</option>
							<option value="company_za">Company Z-A</option>
							<option value="follow_up">Follow-up date</option>
							<option value="priority">Priority</option>
						</Select>
					</label>
					<Button variant="ghost" onClick={resetFilters}>
						Reset
					</Button>
				</div>
			</div>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-5">
					<p className="font-bold text-red-900">{error}</p>
				</div>
			)}

			{isLoading && (
				<div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/40">
					<Spinner label="Loading applications..." />
				</div>
			)}

			{!isLoading && applications.length === 0 && (
				<EmptyState>
					<h3 className="text-lg font-extrabold">
						No applications yet
					</h3>
					<p className="mx-auto max-w-xl leading-7 text-slate-500 text-sm">
						Add your first job application to start tracking your
						job search.
					</p>

					<ButtonLink
						to="/applications/new"
						variant="primary"
						className="mt-2"
					>
						Add application
					</ButtonLink>
				</EmptyState>
			)}

			{!isLoading &&
				applications.length > 0 &&
				filteredApplications.length === 0 && (
					<EmptyState>
						<h3 className="text-lg font-extrabold">
							No matching applications
						</h3>
						<p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">
							Try changing your search, filters, or sorting
							option.
						</p>

						<Button
							onClick={resetFilters}
							variant="secondary"
							className="mt-5"
						>
							Clear filters
						</Button>
					</EmptyState>
				)}

			{!isLoading && filteredApplications.length > 0 && (
				<div className="grid gap-4">
					<div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm font-semibold text-slate-500">
							Showing {(currentPage - 1) * pageSize + 1}-
							{Math.min(
								currentPage * pageSize,
								filteredApplications.length,
							)}{" "}
							of {filteredApplications.length} applications
						</p>

						<label className="flex items-center gap-2 text-sm font-bold text-slate-600">
							Rows
							<Select
								value={pageSize}
								onChange={(event) =>
									setPageSize(Number(event.target.value))
								}
							>
								{tableRowOptions.map((size) => (
									<option key={size} value={size}>
										{size}
									</option>
								))}
							</Select>
						</label>
					</div>

					{paginatedApplications.map((application) => {
						const trackingDate = getTrackingDate(application);

						return (
							<article
								key={application.id}
								className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/80"
							>
								<div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-center">
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<span
												className={[
													"rounded-md px-3 py-1 text-xs font-bold ring-1",
													applicationPriorityBadgeClasses[
														application.priority
													],
												].join(" ")}
											>
												{formatOption(
													application.priority,
												)}
											</span>

											<span
												className={[
													"rounded-full px-2 py-0.5 text-[0.68rem] font-bold ring-1",
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

										<h3 className="mt-2 truncate text-lg font-extrabold text-slate-950">
											{application.role}
										</h3>

										<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-500">
											<span className="inline-flex items-center gap-1.5">
												<Building2
													size={15}
													strokeWidth={2.25}
													className="text-slate-400"
												/>
												{application.company}
											</span>

											{application.location && (
												<span className="inline-flex items-center gap-1.5">
													<MapPin
														size={15}
														strokeWidth={2.25}
														className="text-slate-400"
													/>
													{application.location}
												</span>
											)}

											<span className="inline-flex items-center gap-1.5">
												<Clock3
													size={14}
													strokeWidth={2.25}
													className="text-slate-400"
												/>
												{formatRelativeDate(
													application.appliedAt,
												)}
											</span>
										</div>

										<div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
											<span className="inline-flex items-center gap-1.5">
												<CalendarDays
													size={14}
													strokeWidth={2.25}
													className="text-slate-400"
												/>
												{trackingDate.label}:
												<span className="font-semibold text-slate-700">
													{trackingDate.value}
												</span>
											</span>
										</div>
									</div>

									<div className="flex min-w-0 items-center gap-3 xl:justify-end">
										<Select
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
											aria-label={`Update status for ${application.role}`}
											className="h-10 w-40 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 max-xl:flex-1"
										>
											{APPLICATION_STATUSES.map(
												(status) => (
													<option
														key={status}
														value={status}
													>
														{
															applicationStatusLabels[
																status
															]
														}
													</option>
												),
											)}
										</Select>
										<Link
											to={`/applications/${application.id}`}
											className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"
										>
											Details
										</Link>

										<span
											aria-hidden="true"
											className="hidden h-6 w-px bg-slate-200 xl:inline-block"
										/>

										{application.jobUrl && (
											<IconButtonLink
												to={application.jobUrl}
												tone="link"
												target="_blank"
												rel="noreferrer"
												aria-label={`Open job post for ${application.role}`}
												label={`Open job post for ${application.role}`}
											>
												<ExternalLink
													size={17}
													strokeWidth={2.25}
												/>
											</IconButtonLink>
										)}

										<IconButtonLink
											to={`/applications/${application.id}/edit`}
											aria-label={`Edit ${application.role}`}
											label={`Edit ${application.role}`}
										>
											<Pencil
												size={17}
												strokeWidth={2.25}
											/>
										</IconButtonLink>

										<IconButton
											disabled={
												isDeletingId === application.id
											}
											onClick={() =>
												setDeleteTarget(application)
											}
											label={`Delete ${application.role}`}
											tone="danger"
										>
											<Trash2
												size={17}
												strokeWidth={2.25}
											/>
										</IconButton>
									</div>
								</div>
							</article>
						);
					})}

					<div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40 sm:flex-row sm:items-center sm:justify-between">
						<Button
							disabled={currentPage <= 1}
							onClick={() =>
								setCurrentPage((page) => Math.max(1, page - 1))
							}
							variant="secondary"
						>
							Previous
						</Button>

						<p className="text-center text-sm font-bold text-slate-500">
							Page {currentPage} of {totalPages}
						</p>

						<Button
							disabled={currentPage >= totalPages}
							onClick={() =>
								setCurrentPage((page) =>
									Math.min(totalPages, page + 1),
								)
							}
							variant="secondary"
						>
							Next
						</Button>
					</div>
				</div>
			)}

			<ConfirmationModal
				isOpen={Boolean(deleteTarget)}
				title="Delete application?"
				description={
					deleteTarget
						? `This will permanently delete ${deleteTarget.role} at ${deleteTarget.company}. This action cannot be undone.`
						: ""
				}
				confirmLabel="Delete application"
				isProcessing={Boolean(
					deleteTarget && isDeletingId === deleteTarget.id,
				)}
				onCancel={() => setDeleteTarget(null)}
				onConfirm={confirmDelete}
			/>
		</section>
	);
}
