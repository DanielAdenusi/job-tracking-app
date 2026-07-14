import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import {
	Building2,
	CalendarDays,
	EllipsisVertical,
	GripVertical,
	Plus,
	RefreshCw,
	SlidersHorizontal,
	WifiOff,
} from "lucide-react";

import {
	didLastApplicationsLoadUseCache,
	getApplications,
	updateApplicationStatus,
} from "../services/applicationsApi";
import {
	getPendingCreateCount,
	isLocalApplicationId,
} from "../services/applicationOfflineStore";
import { EmptyState } from "../components/ui/Surface";
import { SearchInput, Select } from "../components/ui/FormControls";
import { Button, ButtonLink } from "../components/ui/Button";
import { ApplicationEventChips } from "../components/ApplicationEventChips";

import {
	APPLICATION_STATUSES,
	type ApplicationStatus,
} from "../constants/applicationOptions";
import {
	applicationStatusColumnClasses,
	applicationStatusLabels,
} from "../constants/applicationStatusStyles";
import { applicationPriorityBadgeClasses } from "../constants/applicationPriorityStyles";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

import type { Application } from "../types/application";

import "./Applications.css";

const statusDescriptions: Record<ApplicationStatus, string> = {
	wishlist: "Roles you are interested in.",
	saved: "Jobs saved for later.",
	applied: "Applications submitted.",
	assessment: "Online tests or tasks.",
	interviewing: "Interview stage roles.",
	offer: "Offers received.",
	rejected: "Unsuccessful applications.",
	withdrawn: "Roles you stopped pursuing.",
};

type BoardSort = "updated_desc" | "updated_asc" | "role_az";

function formatOption(value: string) {
	return value
		.split("_")
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
}

function formatCompactDate(value: string | null) {
	if (!value) return null;

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) return null;

	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
	}).format(date);
}

function getCardDate(application: Application) {
	return formatCompactDate(application.followUpAt || application.deadlineAt);
}

function KanbanSkeleton() {
	return (
		<section
			className="flex h-full min-h-0 flex-col gap-6"
			aria-busy="true"
		>
			<div className="sr-only">Loading Kanban board...</div>

			{/* <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
				<div className="grid gap-4 xl:grid-cols-[minmax(240px,1fr)_auto_auto] xl:items-center">
					<div className="h-10 animate-pulse rounded-lg bg-slate-100" />
					<div className="h-10 w-25 animate-pulse rounded-lg bg-slate-100" />
					<div className="h-10 w-42 animate-pulse rounded-lg bg-slate-200" />
				</div>
			</div> */}

			<div className="-mx-2 min-h-0 flex-1 overflow-hidden px-2 pb-3">
				<div className="grid h-full min-h-0 w-max auto-cols-73.5 grid-flow-col grid-rows-1 gap-4 pt-2">
					{APPLICATION_STATUSES.map((status, columnIndex) => (
						<section
							key={status}
							className={[
								"flex h-full min-h-0 w-73.5 shrink-0 flex-col rounded-xl border border-slate-200 border-t-4 bg-white p-4",
								columnIndex % 4 === 0
									? "border-t-sky-400"
									: columnIndex % 4 === 1
										? "border-t-indigo-400"
										: columnIndex % 4 === 2
											? "border-t-amber-400"
											: "border-t-emerald-400",
							].join(" ")}
						>
							<div className="mb-4 flex items-start justify-between gap-3">
								<div className="grid gap-2">
									<div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
									<div className="h-3 w-44 animate-pulse rounded bg-slate-100" />
									<div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
								</div>
								<div className="h-7 w-10 animate-pulse rounded-full bg-slate-100" />
							</div>

							<div className="grid content-start gap-3 overflow-hidden p-1">
								{Array.from({
									length: columnIndex % 3 === 0 ? 2 : 3,
								}).map((_, cardIndex) => (
									<div
										key={cardIndex}
										className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
									>
										<div className="flex items-center justify-between gap-3">
											<div className="h-6 w-20 animate-pulse rounded-lg bg-slate-100" />
											<div className="h-5 w-5 animate-pulse rounded bg-slate-100" />
										</div>
										<div className="mt-4 h-4 w-44 animate-pulse rounded bg-slate-200" />
										<div className="mt-3 h-3 w-32 animate-pulse rounded bg-slate-100" />
										<div className="my-4 h-px bg-slate-100" />
										<div className="flex items-center justify-between gap-3">
											<div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
											<div className="h-4 w-14 animate-pulse rounded bg-slate-100" />
										</div>
									</div>
								))}
							</div>
						</section>
					))}
				</div>
			</div>
		</section>
	);
}

export function KanbanPage() {
	const [applications, setApplications] = useState<Application[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [updatingId, setUpdatingId] = useState<string | null>(null);
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const [dragOverStatus, setDragOverStatus] =
		useState<ApplicationStatus | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isOfflineData, setIsOfflineData] = useState(false);
	const [pendingCreateCount, setPendingCreateCount] = useState(0);
	const [boardSearch, setBoardSearch] = useState("");
	const [companyFilter, setCompanyFilter] = useState("all");
	const [boardSort, setBoardSort] = useState<BoardSort>("updated_desc");

	const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
	const filterPopoverRef = useRef<HTMLDivElement | null>(null);
	const [isToolbarMenuOpen, setIsToolbarMenuOpen] = useState(false);
	const toolbarMenuRef = useRef<HTMLDivElement | null>(null);
	const debouncedBoardSearch = useDebouncedValue(boardSearch, 250);

	const activeFilterCount = [
		companyFilter !== "all",
		boardSort !== "updated_desc",
	].filter(Boolean).length;

	const companyOptions = useMemo(() => {
		return Array.from(
			new Set(
				applications
					.map((application) => application.company)
					.filter(Boolean),
			),
		).sort((a, b) => a.localeCompare(b));
	}, [applications]);

	const boardApplications = useMemo(() => {
		const query = debouncedBoardSearch.trim().toLowerCase();

		const filtered = applications.filter((application) => {
			const matchesSearch =
				!query ||
				[application.role, application.company, application.location]
					.filter(Boolean)
					.join(" ")
					.toLowerCase()
					.includes(query);

			const matchesCompany =
				companyFilter === "all" ||
				application.company === companyFilter;

			return matchesSearch && matchesCompany;
		});

		return [...filtered].sort((a, b) => {
			switch (boardSort) {
				case "updated_asc":
					return (
						new Date(a.updatedAt).getTime() -
						new Date(b.updatedAt).getTime()
					);
				case "role_az":
					return a.role.localeCompare(b.role);
				case "updated_desc":
				default:
					return (
						new Date(b.updatedAt).getTime() -
						new Date(a.updatedAt).getTime()
					);
			}
		});
	}, [applications, debouncedBoardSearch, boardSort, companyFilter]);

	const columns = useMemo(() => {
		return APPLICATION_STATUSES.map((status) => ({
			status,
			applications: boardApplications.filter(
				(application) => application.status === status,
			),
		}));
	}, [boardApplications]);

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
					: "Failed to load Kanban board",
			);
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		loadApplications();
	}, []);

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

	useEffect(() => {
		if (!isToolbarMenuOpen) return;

		function handlePointerDown(event: PointerEvent) {
			if (
				toolbarMenuRef.current &&
				event.target instanceof Node &&
				!toolbarMenuRef.current.contains(event.target)
			) {
				setIsToolbarMenuOpen(false);
			}
		}

		document.addEventListener("pointerdown", handlePointerDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
		};
	}, [isToolbarMenuOpen]);

	async function moveApplication(
		applicationId: string,
		nextStatus: ApplicationStatus,
	) {
		const application = applications.find(
			(item) => item.id === applicationId,
		);

		if (!application || application.status === nextStatus) return;

		const previousApplications = applications;

		try {
			setError(null);
			setUpdatingId(applicationId);

			setApplications((current) =>
				current.map((item) =>
					item.id === applicationId
						? {
								...item,
								status: nextStatus,
							}
						: item,
				),
			);

			const updatedApplication = await updateApplicationStatus(
				applicationId,
				nextStatus,
			);

			setApplications((current) =>
				current.map((item) =>
					item.id === applicationId ? updatedApplication : item,
				),
			);
			setPendingCreateCount(getPendingCreateCount());
			window.dispatchEvent(new Event("applications:changed"));
		} catch (err) {
			setApplications(previousApplications);
			setError(
				err instanceof Error
					? err.message
					: "Failed to move application",
			);
		} finally {
			setUpdatingId(null);
		}
	}

	function handleDragStart(applicationId: string) {
		return (event: React.DragEvent<HTMLElement>) => {
			setDraggingId(applicationId);
			event.dataTransfer.effectAllowed = "move";
			event.dataTransfer.setData("text/plain", applicationId);
		};
	}

	function handleColumnDragOver(status: ApplicationStatus) {
		return (event: React.DragEvent<HTMLElement>) => {
			event.preventDefault();
			event.dataTransfer.dropEffect = "move";
			setDragOverStatus(status);
		};
	}

	function handleColumnDrop(status: ApplicationStatus) {
		return (event: React.DragEvent<HTMLElement>) => {
			event.preventDefault();

			const applicationId =
				event.dataTransfer.getData("text/plain") || draggingId;

			setDraggingId(null);
			setDragOverStatus(null);

			if (applicationId) {
				moveApplication(applicationId, status);
			}
		};
	}

	function endDrag() {
		setDraggingId(null);
		setDragOverStatus(null);
	}

	function resetFilters() {
		setBoardSearch("");
		setCompanyFilter("all");
		setBoardSort("updated_desc");
		setIsFilterPopoverOpen(false);
	}

	return (
		<section className="flex h-full min-h-0 flex-col gap-6">
			<div className="shrink-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
				<div className="grid gap-4 grid-cols-[1fr_auto]  xl:grid-cols-[minmax(240px,1fr)_auto_auto] xl:items-center">
					<label>
						<SearchInput
							value={boardSearch}
							onChange={setBoardSearch}
							onClear={() => setBoardSearch("")}
							placeholder="Search applications..."
							className="font-medium"
						/>
					</label>

					<div className="flex items-center justify-end gap-3">
						<div ref={filterPopoverRef} className="relative">
							<div className="hidden sm:block">
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
									<span className="hidden sm:inline">
										Filters
									</span>
									{activeFilterCount > 0 && (
										<span className="rounded-full px-2 text-sm font-bold app-accent-text">
											{activeFilterCount}
										</span>
									)}
								</Button>
							</div>

							{isFilterPopoverOpen && (
								<div
									id="applications-filter-popover"
									className="application-filter-popover absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70"
								>
									<div className="grid gap-3">
										<label className="grid gap-2">
											<span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
												Applications
											</span>
											<Select
												value={boardSort}
												onChange={(event) =>
													setBoardSort(
														event.target
															.value as BoardSort,
													)
												}
											>
												<option value="updated_desc">
													Sort by updated date
												</option>
												<option value="updated_asc">
													Oldest updated
												</option>
												<option value="role_az">
													Role A-Z
												</option>
											</Select>
										</label>

										<label className="grid gap-2">
											<span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
												Company
											</span>
											<Select
												value={companyFilter}
												onChange={(event) =>
													setCompanyFilter(
														event.target.value,
													)
												}
											>
												<option value="all">
													Filter by company
												</option>
												{companyOptions.map(
													(company) => (
														<option
															key={company}
															value={company}
														>
															{company}
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

						<div className="hidden sm:block">
							<ButtonLink
								to="/applications/new"
								variant="primary"
								tone="accent"
								icon={<Plus size={17} strokeWidth={2.5} />}
							>
								<span className="hidden sm:inline">
									Add Application
								</span>
							</ButtonLink>
						</div>

						<div
							ref={toolbarMenuRef}
							className="relative sm:hidden"
						>
							<Button
								variant="secondary"
								icon={
									<EllipsisVertical
										size={17}
										strokeWidth={2.5}
									/>
								}
								iconPosition="end"
								onClick={() =>
									setIsToolbarMenuOpen((open) => !open)
								}
								aria-expanded={isToolbarMenuOpen}
								aria-controls="kanban-toolbar-menu"
							></Button>

							{isToolbarMenuOpen && (
								<div
									id="kanban-toolbar-menu"
									className="mobile-more-menu absolute right-0 z-40 mt-2 grid w-56 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70"
								>
									<Button
										variant="ghost"
										tone="neutral"
										align="start"
										onClick={() => {
											setIsFilterPopoverOpen(true);
											setIsToolbarMenuOpen(false);
										}}
										icon={
											<SlidersHorizontal
												size={16}
												strokeWidth={2.5}
											/>
										}
									>
										Filters
										{activeFilterCount > 0 && (
											<span className="rounded-full px-2 text-xs font-black app-accent-text">
												{activeFilterCount}
											</span>
										)}
									</Button>
									<ButtonLink
										to="/applications/new"
										variant="primary"
										tone="accent"
										align="start"
										onClick={() =>
											setIsToolbarMenuOpen(false)
										}
										icon={
											<Plus size={17} strokeWidth={2.5} />
										}
									>
										Add application
									</ButtonLink>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{error && (
				<div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm shadow-amber-100/50">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-3">
							<span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-amber-600 ring-1 ring-amber-200">
								<WifiOff size={18} strokeWidth={2.5} />
							</span>
							<div>
								<p className="font-extrabold text-amber-950">
									Kanban board is unavailable
								</p>
								<p className="mt-1 text-sm font-medium text-amber-800">
									{error}. This browser does not have a saved
									copy to show yet.
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
				<div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm shadow-amber-100/50">
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
										: "The database is not reachable, so this board is using the last saved browser copy."}
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

			{isLoading ? (
				<KanbanSkeleton />
			) : applications.length === 0 ? (
				<EmptyState>
					<h3 className="text-lg font-extrabold">
						No applications yet
					</h3>
					<p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">
						Add your first application to start building your job
						search pipeline.
					</p>

					<ButtonLink
						to="/applications/new"
						variant="primary"
						className="mt-5"
					>
						<Plus size={17} strokeWidth={2.5} />
						Add application
					</ButtonLink>
				</EmptyState>
			) : (
				<>
					<div className="-mx-2 min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-2 pb-3">
						<div className="grid h-full min-h-0 w-max auto-cols-73.5 grid-flow-col grid-rows-1 gap-4 pt-2">
							{columns.map((column) => (
								<section
									key={column.status}
									onDragOver={handleColumnDragOver(
										column.status,
									)}
									onDragLeave={() =>
										setDragOverStatus((current) =>
											current === column.status
												? null
												: current,
										)
									}
									onDrop={handleColumnDrop(column.status)}
									className={[
										"flex h-full min-h-0 w-73.5 shrink-0 flex-col rounded-xl p-4 transition",
										applicationStatusColumnClasses[
											column.status
										],
										dragOverStatus === column.status
											? "app-accent-ring ring-4"
											: "",
									].join(" ")}
								>
									<div className="mb-4 flex items-start justify-between gap-3">
										<div>
											<h3 className="font-extrabold text-slate-950">
												{
													applicationStatusLabels[
														column.status
													]
												}
											</h3>
											<p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
												{
													statusDescriptions[
														column.status
													]
												}
											</p>
										</div>

										<span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-700 shadow-sm">
											{column.applications.length}
										</span>
									</div>

									<div className="grid min-h-0 content-start gap-3 overflow-y-auto p-1 grid-cols-1">
										{column.applications.length === 0 ? (
											<div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
												<p className="font-bold">
													Drop roles here
												</p>
											</div>
										) : (
											column.applications.map(
												(application) => {
													const isUpdating =
														updatingId ===
														application.id;
													const isDragging =
														draggingId ===
														application.id;
													const cardDate =
														getCardDate(
															application,
														);

													return (
														<Link
															key={application.id}
															to={`/applications/${application.id}`}
															draggable={
																!isUpdating
															}
															onDragStart={handleDragStart(
																application.id,
															)}
															onDragEnd={endDrag}
															className={[
																"kanban-application-card block rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm shadow-blue-100/50 transition group",
																isUpdating
																	? "cursor-wait opacity-70"
																	: "cursor-grab active:cursor-grabbing",
																isDragging
																	? "app-accent-ring scale-[0.98] opacity-50 ring-4"
																	: "app-accent-ring hover:shadow-md hover:ring-1 hover:border-(--app-accent)",
															].join(" ")}
														>
															<div className="flex items-center justify-between gap-3">
																<span
																	className={[
																		"inline-flex h-6 items-center rounded-lg px-3 text-xs font-semibold ring-1",
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
																{isLocalApplicationId(
																	application.id,
																) && (
																	<span className="inline-flex h-6 items-center rounded-lg bg-amber-100 px-2 text-[0.65rem] font-bold text-amber-700 ring-1 ring-amber-200">
																		Local
																	</span>
																)}

																<GripVertical
																	size={17}
																	strokeWidth={
																		2.5
																	}
																	className="kanban-drag-handle hidden text-slate-300 opacity-70 transition group-hover:inline-block group-hover:opacity-100 "
																/>
															</div>

															<p className="mt-4 truncate text-sm font-bold text-slate-950 capitalize">
																{
																	application.role
																}
															</p>
															<p className="mt-2 flex items-center gap-2 truncate text-xs font-semibold text-slate-500">
																<Building2
																	size={14}
																	strokeWidth={
																		2
																	}
																	className="text-slate-400"
																/>
																{
																	application.company
																}
															</p>

															<ApplicationEventChips
																application={
																	application
																}
																limit={2}
															/>

															<div
																aria-hidden="true"
																className="my-4 h-px bg-slate-100"
															/>

															<div className="flex items-center justify-between gap-3">
																<p className="min-w-0 truncate text-sm font-semibold text-slate-500">
																	{application.location ||
																		"No location set"}
																</p>

																{cardDate && (
																	<span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-500">
																		<CalendarDays
																			size={
																				14
																			}
																			strokeWidth={
																				2.4
																			}
																			className="text-slate-400"
																		/>
																		{
																			cardDate
																		}
																	</span>
																)}
															</div>
														</Link>
													);
												},
											)
										)}
									</div>
								</section>
							))}
						</div>
					</div>
				</>
			)}
		</section>
	);
}
