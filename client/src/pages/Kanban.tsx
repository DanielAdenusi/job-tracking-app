import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
	Building2,
	CalendarDays,
	GripVertical,
	Plus,
} from "lucide-react";

import {
	getApplications,
	updateApplicationStatus,
} from "../services/applicationsApi";
import { EmptyState, Spinner } from "../components/ui/Surface";
import { SearchInput, Select } from "../components/ui/FormControls";

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

export function KanbanPage() {
	const [applications, setApplications] = useState<Application[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [updatingId, setUpdatingId] = useState<string | null>(null);
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const [dragOverStatus, setDragOverStatus] =
		useState<ApplicationStatus | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [boardSearch, setBoardSearch] = useState("");
	const [companyFilter, setCompanyFilter] = useState("all");
	const [boardSort, setBoardSort] = useState<BoardSort>("updated_desc");
	const debouncedBoardSearch = useDebouncedValue(boardSearch, 250);

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
						: "Failed to load Kanban board",
				);
			} finally {
				setIsLoading(false);
			}
		}

		loadApplications();
	}, []);

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

	if (isLoading) {
		return (
			<section className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm shadow-slate-200/40">
				<Spinner label="Loading Kanban board..." />
			</section>
		);
	}

	return (
		<section className="flex h-full min-h-0 flex-col gap-6">
			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-5">
					<p className="font-bold text-red-900">{error}</p>
				</div>
			)}

			{applications.length === 0 ? (
				<EmptyState>
					<h3 className="text-lg font-extrabold">
						No applications yet
					</h3>
					<p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">
						Add your first application to start building your job
						search pipeline.
					</p>

					<Link
						to="/applications/new"
						className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
					>
						Add application
					</Link>
				</EmptyState>
			) : (
				<>
					<div className="shrink-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
						<div className="grid gap-4 xl:grid-cols-[minmax(240px,1fr)_220px_200px_auto] xl:items-center">
							<label>
								<SearchInput
									value={boardSearch}
									onChange={setBoardSearch}
									onClear={() => setBoardSearch("")}
									placeholder="Search applications..."
									className="font-medium"
								/>
							</label>

							<label>
								<span className="sr-only">
									Filter by company
								</span>
								<Select
									value={companyFilter}
									onChange={(event) =>
										setCompanyFilter(event.target.value)
									}
								>
									<option value="all">
										Filter by company
									</option>
									{companyOptions.map((company) => (
										<option key={company} value={company}>
											{company}
										</option>
									))}
								</Select>
							</label>

							<label>
								<span className="sr-only">
									Sort applications
								</span>
								<Select
									value={boardSort}
									onChange={(event) =>
										setBoardSort(
											event.target.value as BoardSort,
										)
									}
								>
									<option value="updated_desc">
										Sort by updated date
									</option>
									<option value="updated_asc">
										Oldest updated
									</option>
									<option value="role_az">Role A-Z</option>
								</Select>
							</label>

							<Link
								to="/applications/new"
								className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
							>
								<Plus size={17} strokeWidth={2.5} />
								Add Application
							</Link>
						</div>
					</div>

					<div className="-mx-2 min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-2 pb-3">
						<div className="grid h-full min-h-0 w-max auto-cols-73.5 grid-flow-col grid-rows-1 gap-4">
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
										"flex h-full min-h-0 w-73.5 shrink-0 flex-col rounded-xl border p-4 transition",
										applicationStatusColumnClasses[
											column.status
										],
										dragOverStatus === column.status
											? "ring-4 ring-blue-200"
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

									<div className="grid min-h-0 content-start gap-3 overflow-y-auto pr-1">
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
																"block rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm shadow-blue-100/50 transition group",
																isUpdating
																	? "cursor-wait opacity-70"
																	: "cursor-grab active:cursor-grabbing",
																isDragging
																	? "scale-[0.98] opacity-50 ring-4 ring-blue-100"
																	: "hover:shadow-md hover:ring-1 hover:ring-blue-100 hover:border-blue-200",
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

																<GripVertical
																	size={17}
																	strokeWidth={
																		2.5
																	}
																	className="text-slate-300 hidden group-hover:inline-block"
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
