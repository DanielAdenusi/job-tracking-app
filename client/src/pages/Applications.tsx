import {
	type KeyboardEvent,
	type SyntheticEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	ArrowLeft,
	ArrowRight,
	Building2,
	CalendarDays,
	ChevronDown,
	Clock3,
	ExternalLink,
	MapPin,
	Pencil,
	RefreshCw,
	SlidersHorizontal,
	Trash2,
	WifiOff,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";

import {
	deleteApplication,
	didLastApplicationsLoadUseCache,
	getApplications,
	updateApplicationStatus,
} from "../services/applicationsApi";
import {
	getPendingCreateCount,
	isLocalApplicationId,
} from "../services/applicationOfflineStore";

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
import { EmptyState } from "../components/ui/Surface";
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

function ApplicationsListSkeleton() {
	return (
		<div aria-busy="true">
			<div className="sr-only">Loading applications...</div>
			<div className="flex flex-col gap-1 border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
				<div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
			</div>
			<div className="divide-y divide-slate-200">
				{Array.from({ length: 6 }).map((_, index) => (
					<article key={index} className="bg-white p-4 sm:p-5">
						<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(15rem,auto)_auto] xl:items-center">
							<div className="min-w-0">
								<div className="flex flex-wrap gap-2">
									<div className="h-6 w-20 animate-pulse rounded-md bg-slate-200" />
									<div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
								</div>
								<div className="mt-3 h-5 w-64 max-w-full animate-pulse rounded bg-slate-200" />
								<div className="mt-3 flex flex-wrap gap-3">
									<div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
									<div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
									<div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
								</div>
							</div>

							<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
								<div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
								<div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
							</div>

							<div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
								<div className="h-10 w-full animate-pulse rounded-lg bg-slate-100 sm:w-40" />
								<div className="flex gap-2">
									<div className="h-10 w-24 animate-pulse rounded-lg bg-slate-100" />
									<div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
									<div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
								</div>
							</div>
						</div>
					</article>
				))}
			</div>
		</div>
	);
}

export function ApplicationsPage() {
	const [applications, setApplications] = useState<Application[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
	const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isOfflineData, setIsOfflineData] = useState(false);
	const [pendingCreateCount, setPendingCreateCount] = useState(0);
	const [pageSize, setPageSize] = useState(getInitialPageSize);
	const [currentPage, setCurrentPage] = useState(1);
	const [areStatsOpen, setAreStatsOpen] = useState(false);
	const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
	const filterPopoverRef = useRef<HTMLDivElement | null>(null);

	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();

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

	async function loadApplications() {
		try {
			setError(null);
			setIsLoading(true);
			const data = await getApplications();
			setApplications(data);
			setIsOfflineData(didLastApplicationsLoadUseCache());
			setPendingCreateCount(getPendingCreateCount());
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

	useEffect(() => {
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

	useEffect(() => {
		if (!isFilterPopoverOpen) return;

		function handlePointerDown(event: PointerEvent) {
			const popover = filterPopoverRef.current;

			if (
				popover &&
				event.target instanceof Node &&
				!popover.contains(event.target)
			) {
				setIsFilterPopoverOpen(false);
			}
		}

		document.addEventListener("pointerdown", handlePointerDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
		};
	}, [isFilterPopoverOpen]);

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
			setPendingCreateCount(getPendingCreateCount());
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
			setPendingCreateCount(getPendingCreateCount());
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
		setIsFilterPopoverOpen(false);
	}

	function stopRowNavigation(event: SyntheticEvent) {
		event.stopPropagation();
	}

	function handleRowKeyDown(
		event: KeyboardEvent<HTMLElement>,
		applicationId: string,
	) {
		if (event.key !== "Enter" && event.key !== " ") return;

		if (event.target instanceof HTMLElement) {
			const interactiveTarget = event.target.closest(
				"a, button, input, select, textarea, [role='button'], [role='link']",
			);

			if (
				interactiveTarget &&
				interactiveTarget !== event.currentTarget
			) {
				return;
			}
		}

		event.preventDefault();
		navigate(`/applications/${applicationId}`);
	}

	const listStart = (currentPage - 1) * pageSize + 1;
	const listEnd = Math.min(
		currentPage * pageSize,
		filteredApplications.length,
	);
	const activeFilterCount = [
		debouncedSearchTerm.trim(),
		statusFilter !== "all",
		priorityFilter !== "all",
		sortOption !== "newest",
	].filter(Boolean).length;
	const statItems = [
		{
			label: "Total",
			value: stats.total,
			className: "border-sky-200 bg-sky-50 text-sky-900 ring-sky-200",
			dotClassName: "bg-sky-500",
		},
		{
			label: "Showing",
			value: stats.visible,
			className: "border-cyan-200 bg-cyan-50 text-cyan-900 ring-cyan-200",
			dotClassName: "bg-cyan-500",
		},
		{
			label: "Interview",
			value: stats.interviewing,
			className:
				"border-violet-200 bg-violet-50 text-violet-900 ring-violet-200",
			dotClassName: "bg-violet-500",
		},
		{
			label: "Offers",
			value: stats.offers,
			className:
				"border-emerald-200 bg-emerald-50 text-emerald-900 ring-emerald-200",
			dotClassName: "bg-emerald-500",
		},
	] as const;

	return (
		<section className="grid gap-5">
			<div className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
				<div className="border-b border-slate-200 p-4 sm:p-5">
					<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
						<div>
							<p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
								Application list
							</p>
							<h2 className="mt-1 text-xl font-black text-slate-950">
								{stats.visible} application
								{stats.visible === 1 ? "" : "s"}
							</h2>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<div ref={filterPopoverRef} className="relative">
								<Button
									variant="secondary"
									icon={
										<SlidersHorizontal
											size={16}
											strokeWidth={2.5}
										/>
									}
									onClick={() =>
										setIsFilterPopoverOpen((open) => !open)
									}
									aria-expanded={isFilterPopoverOpen}
									aria-controls="applications-filter-popover"
								>
									Filters
									{activeFilterCount > 0 && (
										<span className="rounded-full px-2 text-sm font-bold app-accent-text">
											{activeFilterCount}
										</span>
									)}
								</Button>

								{isFilterPopoverOpen && (
									<div
										id="applications-filter-popover"
										className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70"
									>
										<div className="grid gap-3">
											<label className="grid gap-2">
												<span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
													Search
												</span>
												<SearchInput
													value={searchTerm}
													onChange={setSearchTerm}
													onClear={() =>
														setSearchTerm("")
													}
													placeholder="Search company, role, location..."
													className="font-medium"
												/>
											</label>
											<label className="grid gap-2">
												<span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
													Status
												</span>
												<Select
													value={statusFilter}
													onChange={(event) =>
														setStatusFilter(
															event.target
																.value as StatusFilter,
														)
													}
												>
													<option value="all">
														All statuses
													</option>
													{APPLICATION_STATUSES.map(
														(status) => (
															<option
																key={status}
																value={status}
															>
																{formatOption(
																	status,
																)}
															</option>
														),
													)}
												</Select>
											</label>
											<label className="grid gap-2">
												<span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
													Priority
												</span>
												<Select
													value={priorityFilter}
													onChange={(event) =>
														setPriorityFilter(
															event.target
																.value as PriorityFilter,
														)
													}
												>
													<option value="all">
														All priorities
													</option>
													{APPLICATION_PRIORITIES.map(
														(priority) => (
															<option
																key={priority}
																value={priority}
															>
																{formatOption(
																	priority,
																)}
															</option>
														),
													)}
												</Select>
											</label>
											<label className="grid gap-2">
												<span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
													Sort
												</span>
												<Select
													value={sortOption}
													onChange={(event) =>
														setSortOption(
															event.target
																.value as SortOption,
														)
													}
												>
													<option value="newest">
														Newest first
													</option>
													<option value="oldest">
														Oldest first
													</option>
													<option value="company_az">
														Company A-Z
													</option>
													<option value="company_za">
														Company Z-A
													</option>
													<option value="follow_up">
														Follow-up date
													</option>
													<option value="priority">
														Priority
													</option>
												</Select>
											</label>
											<label className="grid gap-2">
												<span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
													Rows
												</span>
												<Select
													value={pageSize}
													onChange={(event) =>
														setPageSize(
															Number(
																event.target
																	.value,
															),
														)
													}
												>
													{tableRowOptions.map(
														(size) => (
															<option
																key={size}
																value={size}
															>
																{size}
															</option>
														),
													)}
												</Select>
											</label>
											<Button
												variant="ghost"
												onClick={resetFilters}
											>
												Reset filters
											</Button>
										</div>
									</div>
								)}
							</div>

							<Button
								variant="ghost"
								icon={
									<ChevronDown
										size={16}
										strokeWidth={2.5}
										className={[
											"transition-transform",
											areStatsOpen ? "rotate-180" : "",
										].join(" ")}
									/>
								}
								iconPosition="end"
								onClick={() =>
									setAreStatsOpen((isOpen) => !isOpen)
								}
								aria-expanded={areStatsOpen}
								aria-controls="applications-stats-panel"
							>
								Stats
							</Button>
						</div>
					</div>

					{areStatsOpen && (
						<div
							id="applications-stats-panel"
							className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
						>
							{statItems.map((item) => (
								<div
									key={item.label}
									className={[
										"rounded-lg border px-3 py-2 ring-1",
										item.className,
									].join(" ")}
								>
									<div className="flex items-center gap-2">
										<span
											aria-hidden="true"
											className={[
												"h-2.5 w-2.5 rounded-full",
												item.dotClassName,
											].join(" ")}
										/>
										<p className="text-[0.68rem] font-black uppercase tracking-[0.14em] opacity-70">
											{item.label}
										</p>
									</div>
									<p className="mt-1 text-lg font-black">
										{item.value}
									</p>
								</div>
							))}
						</div>
					)}
				</div>

				{error && (
					<div className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm shadow-amber-100/50">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-start gap-3">
								<span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-amber-600 ring-1 ring-amber-200">
									<WifiOff size={18} strokeWidth={2.5} />
								</span>
								<div>
									<p className="font-extrabold text-amber-950">
										Applications are unavailable
									</p>
									<p className="mt-1 text-sm font-medium text-amber-800">
										{error}. This browser does not have a
										saved copy to show yet.
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={loadApplications}
								className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
							>
								<RefreshCw size={16} strokeWidth={2.5} />
								Try again
							</button>
						</div>
					</div>
				)}

				{!error && (isOfflineData || pendingCreateCount > 0) && (
					<div className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm shadow-amber-100/50">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-start gap-3">
								<span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-amber-600 ring-1 ring-amber-200">
									<WifiOff size={18} strokeWidth={2.5} />
								</span>
								<div>
									<p className="font-extrabold text-amber-950">
										Working from browser storage
									</p>
									<p className="mt-1 text-sm font-medium text-amber-800">
										{pendingCreateCount > 0
											? `${pendingCreateCount} local application${
													pendingCreateCount === 1
														? ""
														: "s"
												} will sync when the database is available.`
											: "The database is not reachable, so this list is using the last saved browser copy."}
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={loadApplications}
								className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
							>
								<RefreshCw size={16} strokeWidth={2.5} />
								Sync now
							</button>
						</div>
					</div>
				)}

				{isLoading && <ApplicationsListSkeleton />}

				{!isLoading && applications.length === 0 && (
					<div className="p-4">
						<EmptyState>
							<h3 className="text-lg font-extrabold">
								No applications yet
							</h3>
							<p className="mx-auto max-w-xl text-sm leading-7 text-slate-500">
								Add your first job application to start tracking
								your job search.
							</p>

							<ButtonLink
								to="/applications/new"
								variant="primary"
								className="mt-2"
							>
								Add application
							</ButtonLink>
						</EmptyState>
					</div>
				)}

				{!isLoading &&
					applications.length > 0 &&
					filteredApplications.length === 0 && (
						<div className="p-4">
							<EmptyState>
								<h3 className="text-lg font-extrabold">
									No matching applications
								</h3>
								<p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">
									Try changing your search, filters, or
									sorting option.
								</p>

								<Button
									onClick={resetFilters}
									variant="secondary"
									className="mt-5"
								>
									Clear filters
								</Button>
							</EmptyState>
						</div>
					)}

				{!isLoading && filteredApplications.length > 0 && (
					<div>
						<div className="flex flex-col gap-1 border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-sm font-semibold text-slate-500">
								Showing {listStart}-{listEnd} of{" "}
								{filteredApplications.length} applications
							</p>
							<p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
								Page {currentPage} of {totalPages}
							</p>
						</div>

						<div className="divide-y divide-slate-200">
							{paginatedApplications.map((application) => {
								const trackingDate =
									getTrackingDate(application);

								return (
									<article
										key={application.id}
										role="link"
										tabIndex={0}
										onClick={() =>
											navigate(
												`/applications/${application.id}`,
											)
										}
										onKeyDown={(event) =>
											handleRowKeyDown(
												event,
												application.id,
											)
										}
										className="cursor-pointer bg-white p-4 transition duration-200 ease-out hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:p-5"
									>
										<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(15rem,auto)_auto] xl:items-center">
											<div className="min-w-0 rounded-lg outline-none transition focus-visible:ring-4 focus-visible:ring-blue-100">
												<div className="flex flex-wrap items-center gap-2">
													<span
														className={[
															"rounded-md px-2.5 py-1 text-xs font-bold ring-1",
															applicationPriorityBadgeClasses[
																application
																	.priority
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
																application
																	.status
															],
														].join(" ")}
													>
														{
															applicationStatusLabels[
																application
																	.status
															]
														}
													</span>
													{isLocalApplicationId(
														application.id,
													) && (
														<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.68rem] font-bold text-amber-700 ring-1 ring-amber-200">
															Waiting to sync
														</span>
													)}
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
																strokeWidth={
																	2.25
																}
																className="text-slate-400"
															/>
															{
																application.location
															}
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
											</div>

											<div className="grid gap-2 text-xs font-medium text-slate-500 sm:grid-cols-2 xl:grid-cols-1">
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
												<span className="inline-flex items-center gap-1.5">
													<Clock3
														size={14}
														strokeWidth={2.25}
														className="text-slate-400"
													/>
													Applied:
													<span className="font-semibold text-slate-700">
														{formatDate(
															application.appliedAt,
														)}
													</span>
												</span>
											</div>

											<div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
												<Select
													value={application.status}
													onClick={stopRowNavigation}
													onKeyDown={
														stopRowNavigation
													}
													disabled={
														isUpdatingId ===
														application.id
													}
													onChange={(event) =>
														handleStatusChange(
															application.id,
															event.target
																.value as ApplicationStatus,
														)
													}
													aria-label={`Update status for ${application.role}`}
													className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-40"
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

												<div className="flex w-full items-center gap-2 sm:w-auto">
													<span
														aria-hidden="true"
														className="hidden h-6 w-px bg-slate-200 xl:inline-block"
													/>

													{application.jobUrl && (
														<IconButtonLink
															to={
																application.jobUrl
															}
															tone="link"
															target="_blank"
															rel="noreferrer"
															aria-label={`Open job post for ${application.role}`}
															label={`Open job post for ${application.role}`}
															onClick={
																stopRowNavigation
															}
															onKeyDown={
																stopRowNavigation
															}
														>
															<ExternalLink
																size={17}
																strokeWidth={
																	2.25
																}
															/>
														</IconButtonLink>
													)}

													<IconButtonLink
														to={`/applications/${application.id}/edit`}
														aria-label={`Edit ${application.role}`}
														label={`Edit ${application.role}`}
														onClick={
															stopRowNavigation
														}
														onKeyDown={
															stopRowNavigation
														}
													>
														<Pencil
															size={17}
															strokeWidth={2.25}
														/>
													</IconButtonLink>

													<IconButton
														disabled={
															isDeletingId ===
															application.id
														}
														onClick={(event) => {
															stopRowNavigation(
																event,
															);
															setDeleteTarget(
																application,
															);
														}}
														onKeyDown={
															stopRowNavigation
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
										</div>
									</article>
								);
							})}
						</div>

						<div className="flex flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 p-4">
							<Button
								disabled={currentPage <= 1}
								onClick={() =>
									setCurrentPage((page) =>
										Math.max(1, page - 1),
									)
								}
								variant="secondary"
								icon={<ArrowLeft size={16} strokeWidth={2.5} />}
							>
								<span className="max-sm:hidden">Previous</span>
							</Button>

							<p className="text-center text-sm font-semibold text-slate-400">
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
								icon={
									<ArrowRight size={16} strokeWidth={2.5} />
								}
								iconPosition="end"
							>
								<span className="max-sm:hidden">Next</span>
							</Button>
						</div>
					</div>
				)}
			</div>

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
