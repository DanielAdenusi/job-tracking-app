import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import {
	getApplications,
	updateApplicationStatus,
} from "../services/applicationsApi";

import {
	APPLICATION_STATUSES,
	type ApplicationStatus,
} from "../constants/applicationOptions";

import type { Application } from "../types/application";

const statusLabels: Record<ApplicationStatus, string> = {
	wishlist: "Wishlist",
	saved: "Saved",
	applied: "Applied",
	assessment: "Assessment",
	interviewing: "Interviewing",
	offer: "Offer",
	rejected: "Rejected",
	withdrawn: "Withdrawn",
};

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

const statusColumnClasses: Record<ApplicationStatus, string> = {
	wishlist: "border-slate-200 bg-slate-50",
	saved: "border-blue-200 bg-blue-50",
	applied: "border-indigo-200 bg-indigo-50",
	assessment: "border-purple-200 bg-purple-50",
	interviewing: "border-amber-200 bg-amber-50",
	offer: "border-emerald-200 bg-emerald-50",
	rejected: "border-red-200 bg-red-50",
	withdrawn: "border-zinc-200 bg-zinc-50",
};

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

function formatDate(value: string | null) {
	if (!value) return "No follow-up";

	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
	}).format(new Date(value));
}

function getPreviousStatus(status: ApplicationStatus) {
	const index = APPLICATION_STATUSES.indexOf(status);

	if (index <= 0) {
		return null;
	}

	return APPLICATION_STATUSES[index - 1];
}

function getNextStatus(status: ApplicationStatus) {
	const index = APPLICATION_STATUSES.indexOf(status);

	if (index === -1 || index >= APPLICATION_STATUSES.length - 1) {
		return null;
	}

	return APPLICATION_STATUSES[index + 1];
}

export function KanbanPage() {
	const [applications, setApplications] = useState<Application[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [updatingId, setUpdatingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const columns = useMemo(() => {
		return APPLICATION_STATUSES.map((status) => ({
			status,
			applications: applications.filter(
				(application) => application.status === status,
			),
		}));
	}, [applications]);

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
		const previousApplications = applications;

		try {
			setError(null);
			setUpdatingId(applicationId);

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
					: "Failed to move application",
			);
		} finally {
			setUpdatingId(null);
		}
	}

	if (isLoading) {
		return (
			<section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
				<div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
				<p className="mt-4 font-bold text-slate-700">
					Loading Kanban board...
				</p>
			</section>
		);
	}

	return (
		<section className="grid gap-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div>
					<h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
						Kanban board
					</h2>
					<p className="mt-2 max-w-2xl leading-7 text-slate-600">
						Move applications through your job search pipeline and
						keep track of what stage each role is currently in.
					</p>
				</div>

				<Link
					to="/applications/new"
					className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
				>
					Add application
				</Link>
			</div>

			{error && (
				<div className="rounded-3xl border border-red-200 bg-red-50 p-5">
					<p className="font-bold text-red-900">{error}</p>
				</div>
			)}

			{applications.length === 0 ? (
				<div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
					<h3 className="text-lg font-extrabold">
						No applications yet
					</h3>
					<p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">
						Add your first application to start building your job
						search pipeline.
					</p>

					<Link
						to="/applications/new"
						className="mt-5 inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
					>
						Add application
					</Link>
				</div>
			) : (
				<div className="overflow-x-auto pb-4">
					<div className="grid min-w-[1400px] grid-cols-8 gap-4">
						{columns.map((column) => (
							<section
								key={column.status}
								className={[
									"flex max-h-[calc(100vh-220px)] min-h-[520px] flex-col rounded-3xl border p-4",
									statusColumnClasses[column.status],
								].join(" ")}
							>
								<div className="mb-4">
									<div className="flex items-start justify-between gap-3">
										<div>
											<h3 className="font-extrabold text-slate-950">
												{statusLabels[column.status]}
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
								</div>

								<div className="grid gap-3 overflow-y-auto pr-1">
									{column.applications.length === 0 ? (
										<div className="rounded-2xl border border-dashed border-white/80 bg-white/60 p-4 text-center">
											<p className="text-sm font-bold text-slate-500">
												No roles here
											</p>
										</div>
									) : (
										column.applications.map(
											(application) => {
												const previousStatus =
													getPreviousStatus(
														application.status,
													);
												const nextStatus =
													getNextStatus(
														application.status,
													);
												const isUpdating =
													updatingId ===
													application.id;

												return (
													<article
														key={application.id}
														className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
													>
														<div className="flex items-start justify-between gap-3">
															<div className="min-w-0">
																<p className="truncate text-sm font-extrabold text-slate-950">
																	{
																		application.role
																	}
																</p>
																<p className="mt-1 truncate text-xs font-semibold text-slate-500">
																	{
																		application.company
																	}
																</p>
															</div>

															<span
																className={[
																	"shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-extrabold",
																	statusBadgeClasses[
																		application
																			.status
																	],
																].join(" ")}
															>
																{
																	statusLabels[
																		application
																			.status
																	]
																}
															</span>
														</div>

														{application.location && (
															<p className="mt-3 text-xs font-semibold text-slate-500">
																{
																	application.location
																}
															</p>
														)}

														<div className="mt-4 rounded-2xl bg-slate-50 p-3">
															<p className="text-xs font-bold text-slate-500">
																Follow-up
															</p>
															<p className="mt-1 text-sm font-extrabold text-slate-800">
																{formatDate(
																	application.followUpAt,
																)}
															</p>
														</div>

														<div className="mt-4 grid gap-2">
															<select
																value={
																	application.status
																}
																disabled={
																	isUpdating
																}
																onChange={(
																	event,
																) =>
																	moveApplication(
																		application.id,
																		event
																			.target
																			.value as ApplicationStatus,
																	)
																}
																className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
															>
																{APPLICATION_STATUSES.map(
																	(
																		status,
																	) => (
																		<option
																			key={
																				status
																			}
																			value={
																				status
																			}
																		>
																			{
																				statusLabels[
																					status
																				]
																			}
																		</option>
																	),
																)}
															</select>

															<div className="grid grid-cols-2 gap-2">
																<button
																	type="button"
																	disabled={
																		!previousStatus ||
																		isUpdating
																	}
																	onClick={() => {
																		if (
																			previousStatus
																		) {
																			moveApplication(
																				application.id,
																				previousStatus,
																			);
																		}
																	}}
																	className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
																>
																	← Back
																</button>

																<button
																	type="button"
																	disabled={
																		!nextStatus ||
																		isUpdating
																	}
																	onClick={() => {
																		if (
																			nextStatus
																		) {
																			moveApplication(
																				application.id,
																				nextStatus,
																			);
																		}
																	}}
																	className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
																>
																	Next →
																</button>
															</div>

															<Link
																to={`/applications/${application.id}`}
																className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-3 text-xs font-bold text-white transition hover:bg-slate-700"
															>
																View details
															</Link>
														</div>
													</article>
												);
											},
										)
									)}
								</div>
							</section>
						))}
					</div>
				</div>
			)}
		</section>
	);
}
