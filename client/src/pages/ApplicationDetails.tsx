import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
	ArrowLeft,
	BriefcaseBusiness,
	Building2,
	CalendarDays,
	ExternalLink,
	FileText,
	MapPin,
	MessageSquare,
	Pencil,
	Trash2,
} from "lucide-react";
import {
	applicationStatusBadgeClasses,
	applicationStatusLabels,
} from "../constants/applicationStatusStyles";
import {
	deleteApplication,
	getApplication,
	updateApplication,
	updateApplicationStatus,
} from "../services/applicationsApi";
import type { ApplicationStatus } from "../constants/applicationOptions";
import type { Application } from "../types/application";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { Button, ButtonLink } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Textarea } from "../components/ui/FormControls";
import { APP_NAME } from "../constants/pageTitle";

const STATUS_ADVANCE_ORDER: ApplicationStatus[] = [
	"wishlist",
	"saved",
	"applied",
	"assessment",
	"interviewing",
	"offer",
];

function formatOption(value: string | null) {
	if (!value) return "Not specified";

	return value
		.split("_")
		.map((word, index) =>
			index === 0 ? word[0].toUpperCase() + word.slice(1) : word,
		)
		.join("-");
}

function formatDate(value: string | null, fallback = "Not specified") {
	if (!value) return fallback;

	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(value));
}

function formatShortDate(value: string | null) {
	if (!value) return "";

	return new Intl.DateTimeFormat("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
	}).format(new Date(value));
}

function formatTimelineTimestamp(value: string | null) {
	if (!value) return "Date not recorded";

	return new Intl.DateTimeFormat("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(value));
}

function getNextStatus(status: ApplicationStatus) {
	const index = STATUS_ADVANCE_ORDER.indexOf(status);

	if (index === -1 || index >= STATUS_ADVANCE_ORDER.length - 1) {
		return null;
	}

	return STATUS_ADVANCE_ORDER[index + 1];
}

function getTimelineTitle(status: ApplicationStatus, index: number) {
	if (index === 0 && status === "wishlist") {
		return "Wishlisted";
	}

	if (status === "offer") {
		return "Moved to Offered";
	}

	return `Moved to ${applicationStatusLabels[status]}`;
}

function getTimelineTransitions(application: Application) {
	if (application.statusTransitions.length > 0) {
		return application.statusTransitions;
	}

	return [
		{
			status: application.status,
			transitionedAt: application.updatedAt || application.createdAt,
		},
	];
}

export function ApplicationDetailsPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	const [application, setApplication] = useState<Application | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isDiscardNotesModalOpen, setIsDiscardNotesModalOpen] =
		useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isSavingNotes, setIsSavingNotes] = useState(false);
	const [notesDraft, setNotesDraft] = useState("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadApplication() {
			if (!id) {
				setError("Missing application ID");
				setIsLoading(false);
				return;
			}

			try {
				setError(null);
				const data = await getApplication(id);
				setApplication(data);
				setNotesDraft(data.notes || "");
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to load application",
				);
			} finally {
				setIsLoading(false);
			}
		}

		loadApplication();
	}, [id]);

	useEffect(() => {
		if (isLoading) {
			document.title = `Application Details - ${APP_NAME}`;
			return;
		}

		document.title = application
			? `${application.company} - ${APP_NAME}`
			: `Application Not Found - ${APP_NAME}`;
	}, [application, isLoading]);

	async function confirmDelete() {
		if (!application) return;

		try {
			setIsDeleting(true);
			await deleteApplication(application.id);
			window.dispatchEvent(new Event("applications:changed"));
			navigate("/applications", { replace: true });
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to delete application",
			);
		} finally {
			setIsDeleting(false);
			setIsDeleteModalOpen(false);
		}
	}

	async function handleSaveNotes() {
		if (!application) return;

		try {
			setError(null);
			setIsSavingNotes(true);
			const updatedApplication = await updateApplication(application.id, {
				notes: notesDraft,
			});
			setApplication(updatedApplication);
			setNotesDraft(updatedApplication.notes || "");
			window.dispatchEvent(new Event("applications:changed"));
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to save notes",
			);
		} finally {
			setIsSavingNotes(false);
		}
	}

	async function handleMarkNextStatus(nextStatus: ApplicationStatus) {
		if (!application) return;

		try {
			setError(null);
			const updatedApplication = await updateApplicationStatus(
				application.id,
				nextStatus,
			);
			setApplication(updatedApplication);
			window.dispatchEvent(new Event("applications:changed"));
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to update application",
			);
		}
	}

	function confirmDiscardNotes() {
		if (!application) return;

		setNotesDraft(application.notes || "");
		setIsDiscardNotesModalOpen(false);
	}

	if (isLoading) {
		return (
			<section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/40">
				<h3 className="font-extrabold">Loading application...</h3>
			</section>
		);
	}

	if (!application) {
		return (
			<section className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
				<h3 className="font-extrabold text-red-900">
					Application not found
				</h3>
				<p className="mt-2 text-red-700">
					{error || "This application does not exist."}
				</p>

				<div className="mt-5">
					<Link
						to="/applications"
						className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
					>
						Back to applications
					</Link>
				</div>
			</section>
		);
	}

	const addedDate = formatShortDate(application.createdAt);
	const notesHaveChanges = notesDraft !== (application.notes || "");
	const nextStatus = getNextStatus(application.status);
	const timelineTransitions = getTimelineTransitions(application);

	return (
		<section className="grid min-w-0 max-w-full gap-6 overflow-x-hidden">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Link
					to="/applications"
					className="inline-flex h-8 items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
				>
					<span className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
						<ArrowLeft size={16} strokeWidth={2.5} />
					</span>
					Back to Applications
				</Link>

				<span className="inline-flex items-center gap-2 text-sm font-bold text-slate-400">
					<CalendarDays size={16} strokeWidth={2.4} />
					Added {addedDate}
				</span>
			</div>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-4">
					<p className="font-bold text-red-900">{error}</p>
				</div>
			)}

			<article className="w-full max-w-full rounded-xl border border-slate-200 bg-white px-8 py-9 shadow-sm shadow-slate-200/50">
				<div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-3">
							<h2 className="text-2xl font-bold tracking-tight text-slate-950 md:text-[30px] md:leading-9">
								{application.role}
							</h2>
							<span
								className={[
									"inline-flex rounded-md px-3 py-1 text-xs font-bold ring-1",
									applicationStatusBadgeClasses[
										application.status
									],
								].join(" ")}
							>
								{applicationStatusLabels[application.status]}
							</span>
						</div>

						<div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-base font-semibold text-slate-500">
							<span className="inline-flex items-center gap-2">
								<Building2
									size={19}
									strokeWidth={2.4}
									className="text-blue-600"
								/>
								{application.company}
							</span>

							{application.location && (
								<span className="inline-flex items-center gap-2">
									<MapPin
										size={18}
										strokeWidth={2.4}
										className="text-slate-400"
									/>
									{application.location}
								</span>
							)}
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						{application.jobUrl && (
							<ButtonLink
								to={application.jobUrl}
								target="_blank"
								rel="noreferrer"
								variant="secondary"
							>
								<ExternalLink size={16} strokeWidth={2.5} />
								Open Post
							</ButtonLink>
						)}

						<ButtonLink
							to={`/applications/${application.id}/edit`}
							variant="primary"
							icon={<Pencil size={16} strokeWidth={2.5} />}
						>
							Edit Record
						</ButtonLink>

						<IconButton
							onClick={() => setIsDeleteModalOpen(true)}
							label={`Delete ${application.role}`}
							tone="danger"
						>
							<Trash2 size={16} strokeWidth={2.5} />
						</IconButton>
					</div>
				</div>
			</article>

			<div className="grid min-w-0 max-w-full items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
				<article className="h-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-6 py-7 shadow-sm shadow-slate-200/50">
					<h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
						<BriefcaseBusiness
							size={18}
							strokeWidth={2.4}
							className="text-slate-400"
						/>
						Key Details
					</h3>

					<dl className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
						<div>
							<dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
								Priority
							</dt>
							<dd className="mt-2">
								<span className="rounded-md bg-violet-50 px-4 py-1 text-xs font-bold text-violet-700 ring-1 ring-violet-200">
									{formatOption(application.priority)}
								</span>
							</dd>
						</div>

						<div>
							<dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
								Work Mode
							</dt>
							<dd className="mt-2 text-sm font-bold text-slate-950">
								{formatOption(application.workMode)}
							</dd>
						</div>

						<div>
							<dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
								Employment
							</dt>
							<dd className="mt-2 text-sm font-bold text-slate-950">
								{formatOption(application.employmentType)}
							</dd>
						</div>

						<div>
							<dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
								Applied Date
							</dt>
							<dd className="mt-2 text-sm font-bold text-slate-950">
								{formatDate(application.appliedAt)}
							</dd>
						</div>

						<div>
							<dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
								Follow-up Date
							</dt>
							<dd className="mt-2 text-sm font-bold text-slate-950">
								{formatDate(application.followUpAt)}
							</dd>
						</div>

						<div>
							<dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
								Salary Range
							</dt>
							<dd className="mt-2 text-sm font-bold text-slate-950">
								{application.salary || "-"}
							</dd>
						</div>
					</dl>
				</article>

				<article className="flex h-full min-w-0 max-w-full flex-col rounded-xl border border-slate-200 bg-white px-6 py-7 shadow-sm shadow-slate-200/50">
					<h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
						<MessageSquare
							size={18}
							strokeWidth={2.4}
							className="text-slate-400"
						/>
						Activity Timeline
					</h3>

					<div className="mt-7 space-y-6">
						{timelineTransitions.map((transition, index) => {
							const { status } = transition;
							const isCurrentStatus =
								status === application.status;
							const isLastItem =
								index === timelineTransitions.length - 1;
							const dateText = formatTimelineTimestamp(
								transition.transitionedAt,
							);

							return (
								<div
									key={`${status}-${index}`}
									className="relative pl-6"
								>
									<span
										className={[
											"absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border-2 bg-white",
											isCurrentStatus
												? "border-blue-600"
												: "border-slate-300",
										].join(" ")}
									/>
									{!isLastItem && (
										<span className="absolute left-1 top-5 h-[calc(100%+1.5rem)] w-px bg-slate-200" />
									)}
									<div className="flex flex-wrap items-center gap-2">
										<p
											className={[
												"text-sm font-bold",
												isCurrentStatus
													? "text-slate-950"
													: "text-slate-600",
											].join(" ")}
										>
											{getTimelineTitle(status, index)}
										</p>
										<span
											className={[
												"rounded-full px-2 py-0.5 text-[0.65rem] font-bold ring-1",
												applicationStatusBadgeClasses[
													status
												],
											].join(" ")}
										>
											{applicationStatusLabels[status]}
										</span>
									</div>
									<p className="mt-1 text-xs font-semibold text-slate-500">
										{dateText}
									</p>
									{isCurrentStatus && nextStatus && (
										<Button
											variant="ghost"
											size="sm"
											className="mt-4"
											onClick={() =>
												handleMarkNextStatus(nextStatus)
											}
										>
											Mark as{" "}
											{
												applicationStatusLabels[
													nextStatus
												]
											}
										</Button>
									)}
								</div>
							);
						})}
					</div>
				</article>

				<article className="grid min-w-0 max-w-full gap-5 overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 xl:col-span-2">
					<h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
						<FileText
							size={18}
							strokeWidth={2.4}
							className="text-slate-400"
						/>
						Private Notes
					</h3>

					<Textarea
						value={notesDraft}
						onChange={(event) => setNotesDraft(event.target.value)}
						placeholder="Add notes about the role, required skills, or interview prep..."
						className="min-h-56"
					/>

					<div className="flex min-w-0 flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						{notesHaveChanges && (
							<Button
								onClick={() => setIsDiscardNotesModalOpen(true)}
								disabled={isSavingNotes}
								variant="secondary"
							>
								Discard Changes
							</Button>
						)}

						<Button
							onClick={handleSaveNotes}
							disabled={isSavingNotes || !notesHaveChanges}
							variant="primary"
							isLoading={isSavingNotes}
						>
							{isSavingNotes ? "Saving..." : "Save Notes"}
						</Button>
					</div>
				</article>
			</div>

			<ConfirmationModal
				isOpen={isDeleteModalOpen}
				title="Delete application?"
				description={`This will permanently delete ${application.role} at ${application.company}. This action cannot be undone.`}
				confirmLabel="Delete application"
				isProcessing={isDeleting}
				onCancel={() => setIsDeleteModalOpen(false)}
				onConfirm={confirmDelete}
			/>

			<ConfirmationModal
				isOpen={isDiscardNotesModalOpen}
				title="Discard note changes?"
				description="Your unsaved private notes will be reset to the last saved version."
				confirmLabel="Discard changes"
				onCancel={() => setIsDiscardNotesModalOpen(false)}
				onConfirm={confirmDiscardNotes}
			/>
		</section>
	);
}
