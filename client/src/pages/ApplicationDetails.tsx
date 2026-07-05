import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
	ArrowLeft,
	Briefcase,
	BriefcaseBusiness,
	Building2,
	CalendarCheck,
	CalendarClock,
	CalendarDays,
	Check,
	ExternalLink,
	FileText,
	Flag,
	Laptop,
	Lock,
	MapPin,
	MessageSquare,
	PencilLine,
	PoundSterling,
	Trash2,
	WifiOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { isLocalApplicationId } from "../services/applicationOfflineStore";
import { type ApplicationStatus } from "../constants/applicationOptions";
import type { Application } from "../types/application";
import type { ApplicationStatusTransition } from "../types/application";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { Button, ButtonLink } from "../components/ui/Button";
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

const COMPANY_ACCENTS = [
	{ bg: "bg-blue-50", text: "text-blue-700" },
	{ bg: "bg-violet-50", text: "text-violet-700" },
	{ bg: "bg-amber-50", text: "text-amber-700" },
	{ bg: "bg-emerald-50", text: "text-emerald-700" },
	{ bg: "bg-rose-50", text: "text-rose-700" },
	{ bg: "bg-cyan-50", text: "text-cyan-700" },
] as const;

function getCompanyAccent(name: string) {
	const sum = name
		.split("")
		.reduce((total, char) => total + char.charCodeAt(0), 0);

	return COMPANY_ACCENTS[sum % COMPANY_ACCENTS.length];
}

const PRIORITY_BADGE_CLASSES: Record<string, string> = {
	low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
	medium: "bg-amber-50 text-amber-700 ring-amber-200",
	high: "bg-rose-50 text-rose-700 ring-rose-200",
};

function getPriorityBadgeClasses(priority: string | null) {
	if (!priority) return "bg-slate-100 text-slate-600 ring-slate-200";

	return (
		PRIORITY_BADGE_CLASSES[priority] ??
		"bg-slate-100 text-slate-600 ring-slate-200"
	);
}

// Gives each Key Details field its own icon-chip colour, the same visual
// language as the dashboard's Overview metrics, so this page reads as part
// of the same product rather than a plain fact sheet.
const FIELD_ACCENT_CLASSES = {
	violet: "bg-violet-50 text-violet-600",
	cyan: "bg-cyan-50 text-cyan-600",
	blue: "bg-blue-50 text-blue-600",
	emerald: "bg-emerald-50 text-emerald-600",
	amber: "bg-amber-50 text-amber-600",
	teal: "bg-teal-50 text-teal-600",
} as const;

type FieldAccent = keyof typeof FIELD_ACCENT_CLASSES;

// Mirrors the "Stage X of 5 / Y% completed" convention used on the
// Dashboard's recent-applications list. Wishlist sits before the active
// pipeline, so it's shown as a floor value rather than a computed 0%.
function getPipelineProgress(status: ApplicationStatus) {
	const activeStages = STATUS_ADVANCE_ORDER.slice(1);
	const totalStages = activeStages.length;

	if (status === "wishlist") {
		return { stageNumber: 1, totalStages, percent: 10 };
	}

	const position = activeStages.indexOf(status);

	if (position === -1) {
		return null;
	}

	return {
		stageNumber: position + 1,
		totalStages,
		percent: Math.round((position / (totalStages - 1)) * 100),
	};
}

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
	if (index === 0) {
		if (status === "wishlist") {
			return "Wishlisted";
		} else if (status === "saved") {
			return "Saved";
		} else if (status === "applied") {
			return "Applied";
		} else if (status === "assessment") {
			return "Assessment";
		} else if (status === "interviewing") {
			return "Interviewing";
		} else if (status === "offer") {
			return "Offered";
		} else if (status === "rejected") {
			return "Rejected";
		} else if (status === "withdrawn") {
			return "Withdrawn";
		}
	}

	if (status === "offer") {
		return "Moved to Offered";
	}

	return `Moved to ${applicationStatusLabels[status]}`;
}

function getTimelineTransitions(application: Application) {
	const transitions =
		application.statusTransitions.length > 0
			? application.statusTransitions
			: [
					{
						status: application.status,
						transitionedAt:
							application.updatedAt || application.createdAt,
					},
				];

	const latestTransitionByStatus = transitions.reduce<
		Partial<Record<ApplicationStatus, ApplicationStatusTransition>>
	>((latestByStatus, transition) => {
		const currentLatest = latestByStatus[transition.status];

		if (
			!currentLatest ||
			new Date(transition.transitionedAt).getTime() >=
				new Date(currentLatest.transitionedAt).getTime()
		) {
			latestByStatus[transition.status] = transition;
		}

		return latestByStatus;
	}, {});

	const currentStageIndex = STATUS_ADVANCE_ORDER.indexOf(application.status);

	if (currentStageIndex !== -1) {
		const pipelineTransitions = STATUS_ADVANCE_ORDER.slice(
			0,
			currentStageIndex + 1,
		)
			.map((status) => latestTransitionByStatus[status])
			.filter(
				(
					transition,
				): transition is ApplicationStatusTransition =>
					Boolean(transition),
			);

		if (
			!pipelineTransitions.some(
				(transition) => transition.status === application.status,
			)
		) {
			pipelineTransitions.push({
				status: application.status,
				transitionedAt: application.updatedAt || application.createdAt,
			});
		}

		return pipelineTransitions;
	}

	const latestTransitions = Object.values(latestTransitionByStatus)
		.filter(
			(transition): transition is ApplicationStatusTransition =>
				Boolean(transition),
		)
		.sort(
			(first, second) =>
				new Date(first.transitionedAt).getTime() -
				new Date(second.transitionedAt).getTime(),
		);

	if (
		!latestTransitions.some(
			(transition) => transition.status === application.status,
		)
	) {
		latestTransitions.push({
			status: application.status,
			transitionedAt: application.updatedAt || application.createdAt,
		});
	}

	return latestTransitions;
}

function DetailField({
	icon: Icon,
	label,
	children,
	accent = "teal",
	className = "",
}: {
	icon: LucideIcon;
	label: string;
	children: ReactNode;
	accent?: FieldAccent;
	className?: string;
}) {
	return (
		<div
			className={`application-detail-field group rounded-lg border border-slate-100 bg-slate-50/70 p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-md hover:shadow-slate-200/60 ${className}`}
		>
			<dt className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-widest text-slate-400">
				<span
					className={`application-detail-icon grid h-6 w-6 shrink-0 place-items-center rounded-md transition-transform duration-150 group-hover:scale-105 ${FIELD_ACCENT_CLASSES[accent]}`}
				>
					<Icon size={13} strokeWidth={2.5} />
				</span>
				{label}
			</dt>
			<dd className="mt-2.5 text-sm font-bold text-slate-950">
				{children}
			</dd>
		</div>
	);
}

function SkeletonBlock({ className }: { className: string }) {
	return (
		<div
			className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`}
		/>
	);
}

function ApplicationDetailsSkeleton() {
	return (
		<section
			className="grid min-w-0 max-w-full gap-5 overflow-x-hidden"
			aria-label="Loading application details"
		>
			<article className="application-detail-panel relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
				<SkeletonBlock className="absolute inset-x-0 top-0 h-1.5 rounded-none" />

				<div className="flex flex-col gap-3 border-b border-slate-100 px-5 pb-4 pt-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
					<div className="flex items-center gap-2">
						<SkeletonBlock className="h-8 w-8" />
						<SkeletonBlock className="h-4 w-36" />
					</div>
					<SkeletonBlock className="h-4 w-28" />
				</div>

				<div className="flex flex-col gap-6 px-5 py-6 sm:px-8 sm:py-7 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex min-w-0 items-start gap-4 sm:items-center">
						<SkeletonBlock className="h-14 w-14 shrink-0 rounded-2xl" />
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-3">
								<SkeletonBlock className="h-8 w-56 max-w-full" />
								<SkeletonBlock className="h-7 w-20" />
							</div>
							<div className="mt-3 flex flex-col gap-3 sm:flex-row">
								<SkeletonBlock className="h-5 w-44" />
								<SkeletonBlock className="h-5 w-28" />
							</div>
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-3 lg:flex">
						<SkeletonBlock className="h-10 w-full sm:w-32" />
						<SkeletonBlock className="h-10 w-full sm:w-32" />
						<SkeletonBlock className="h-10 w-full sm:w-10" />
					</div>
				</div>

				<div className="px-5 pb-6 sm:px-8 sm:pb-7">
					<SkeletonBlock className="h-1.5 w-full" />
					<div className="mt-2 flex items-center justify-between">
						<SkeletonBlock className="h-3 w-20" />
						<SkeletonBlock className="h-3 w-24" />
					</div>
				</div>
			</article>

			<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
				<article className="rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm shadow-slate-200/50 sm:px-6 sm:py-7">
					<SkeletonBlock className="h-6 w-36" />
					<div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
						{Array.from({ length: 6 }).map((_, index) => (
							<div
								key={index}
								className="rounded-lg border border-slate-100 bg-slate-50 p-4"
							>
								<SkeletonBlock className="h-3 w-20" />
								<SkeletonBlock className="mt-3 h-4 w-24" />
							</div>
						))}
					</div>
				</article>

				<article className="rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm shadow-slate-200/50 sm:px-6 sm:py-7">
					<SkeletonBlock className="h-6 w-40" />
					<div className="mt-7 space-y-5">
						{Array.from({ length: 2 }).map((_, index) => (
							<div key={index} className="flex gap-3">
								<SkeletonBlock className="mt-1 h-3 w-3 rounded-full" />
								<div className="flex-1">
									<SkeletonBlock className="h-4 w-36" />
									<SkeletonBlock className="mt-2 h-3 w-24" />
								</div>
							</div>
						))}
					</div>
				</article>

				<article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6 xl:col-span-2">
					<SkeletonBlock className="h-6 w-32" />
					<SkeletonBlock className="mt-5 h-40 w-full" />
				</article>
			</div>
		</section>
	);
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
		return <ApplicationDetailsSkeleton />;
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
	const isLocalApplication = isLocalApplicationId(application.id);
	const companyAccent = getCompanyAccent(application.company);
	const companyInitial =
		application.company.trim().charAt(0).toUpperCase() || "?";
	const pipelineProgress = getPipelineProgress(application.status);
	const currentStageIndex = STATUS_ADVANCE_ORDER.indexOf(application.status);
	const upcomingStatuses =
		currentStageIndex === -1
			? []
			: STATUS_ADVANCE_ORDER.slice(currentStageIndex + 1);

	return (
		<section className="application-details-page grid min-w-0 max-w-full gap-6 overflow-x-hidden">
			{isLocalApplication && (
				<div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm shadow-amber-100/50">
					<div className="flex items-start gap-3">
						<span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-amber-600 ring-1 ring-amber-200">
							<WifiOff size={18} strokeWidth={2.5} />
						</span>
						<div>
							<p className="font-extrabold text-amber-950">
								Saved in this browser
							</p>
							<p className="mt-1 text-sm font-medium text-amber-800">
								This application was added while the database
								was unavailable. It will be created in the
								database the next time application sync
								succeeds.
							</p>
						</div>
					</div>
				</div>
			)}

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-4">
					<p className="font-bold text-red-900">{error}</p>
				</div>
			)}

			<article className="application-detail-panel relative w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
				<span
					className={`absolute inset-x-0 top-0 h-1.5 ${applicationStatusBadgeClasses[application.status]}`}
					aria-hidden="true"
				/>

				<div className="flex flex-row gap-3 border-b border-slate-100 px-5 pb-4 pt-6 justify-between sm:px-8">
					<ButtonLink
						to="/applications"
						tone="neutral"
						icon={<ArrowLeft size={16} strokeWidth={2.5} />}
						aria-label="Back to applications list"
					>
						<span className="max-sm:hidden">
							Back to applications
						</span>
					</ButtonLink>

					<span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-400 sm:justify-end">
						<CalendarDays size={16} strokeWidth={2.4} />
						Added {addedDate}
					</span>
				</div>

				<div className="flex flex-col gap-5 px-5 py-6 sm:px-8 sm:py-7 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex min-w-0 items-start gap-4 sm:items-center">
						<span
							className={`application-company-avatar grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-lg font-extrabold shadow-sm ring-2 ring-slate-50 ring-offset-1 ring-offset-slate-200 ${companyAccent.bg} ${companyAccent.text}`}
							aria-hidden="true"
						>
							{companyInitial}
						</span>

						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-3">
								<h2 className="min-w-0 text-2xl font-bold tracking-tight text-slate-950 md:text-[30px] md:leading-9">
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
									{
										applicationStatusLabels[
											application.status
										]
									}
								</span>
							</div>

							<div className="mt-2 grid gap-1.5 text-base font-semibold text-slate-500 sm:flex sm:flex-wrap sm:items-center sm:gap-x-5">
								<span className="inline-flex min-w-0 items-center gap-1.5">
									<Building2
										size={17}
										strokeWidth={2.4}
										className="shrink-0 text-slate-400"
									/>
									<span className="truncate">
										{application.company}
									</span>
								</span>

								{application.location && (
									<span className="inline-flex min-w-0 items-center gap-1.5">
										<MapPin
											size={17}
											strokeWidth={2.4}
											className="shrink-0 text-slate-400"
										/>
										<span className="truncate">
											{application.location}
										</span>
									</span>
								)}
							</div>
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))_auto] lg:flex lg:flex-wrap lg:items-center">
						{application.jobUrl && (
							<ButtonLink
								to={application.jobUrl}
								target="_blank"
								rel="noreferrer"
								className="w-full sm:w-auto"
							>
								<ExternalLink size={16} strokeWidth={2.5} />
								Open Post
							</ButtonLink>
						)}

						<ButtonLink
							to={`/applications/${application.id}/edit`}
							tone="neutral"
							icon={<PencilLine size={16} strokeWidth={2.5} />}
							className="w-full sm:w-auto"
						>
							Edit Record
						</ButtonLink>

						<Button
							onClick={() => setIsDeleteModalOpen(true)}
							tone="danger"
							className="max-sm:w-full"
							icon={<Trash2 size={16} strokeWidth={2.5} />}
						>
							Delete
						</Button>
					</div>
				</div>

				{pipelineProgress && (
					<div className="px-5 pb-6 sm:px-8 sm:pb-7">
						<div className="application-progress-track h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
							<div
								className="h-full rounded-full bg-lime-500 transition-[width] duration-500"
								style={{
									width: `${pipelineProgress.percent}%`,
								}}
							/>
						</div>
						<div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-400">
							<span>
								Stage {pipelineProgress.stageNumber} of{" "}
								{pipelineProgress.totalStages}
							</span>
							<span>{pipelineProgress.percent}% completed</span>
						</div>
					</div>
				)}
			</article>

			<div className="grid min-w-0 max-w-full items-start gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
				<article className="application-detail-panel min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm shadow-slate-200/50 transition-shadow duration-200 hover:shadow-md hover:shadow-slate-200/60 sm:px-6 sm:py-7 xl:row-start-1 ">
					<h3 className="flex items-center gap-2.5 text-lg font-bold text-slate-950">
						<span className="application-detail-icon grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-600">
							<BriefcaseBusiness size={16} strokeWidth={2.4} />
						</span>
						Key Details
					</h3>

					<dl className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:grid-cols-3 sm:gap-4">
						<DetailField
							icon={Flag}
							label="Priority"
							accent="violet"
						>
							<span
								className={[
									"application-priority-badge rounded-md px-3 py-1 text-xs font-bold ring-1",
									getPriorityBadgeClasses(
										application.priority,
									),
								].join(" ")}
							>
								{formatOption(application.priority)}
							</span>
						</DetailField>

						<DetailField
							icon={Laptop}
							label="Work Mode"
							accent="cyan"
						>
							{formatOption(application.workMode)}
						</DetailField>

						<DetailField
							icon={Briefcase}
							label="Employment"
							accent="blue"
						>
							{formatOption(application.employmentType)}
						</DetailField>

						<DetailField
							icon={CalendarCheck}
							label="Applied Date"
							accent="emerald"
						>
							{formatDate(application.appliedAt)}
						</DetailField>

						<DetailField
							icon={CalendarClock}
							label="Follow-up Date"
							accent="amber"
						>
							{formatDate(application.followUpAt)}
						</DetailField>

						<DetailField
							icon={PoundSterling}
							label="Salary Range"
							accent="teal"
							className="col-span-2 sm:col-span-1"
						>
							{application.salary || "Not specified"}
						</DetailField>
					</dl>
				</article>

				<article className="application-detail-panel grid min-w-0 max-w-full gap-5 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition-shadow duration-200 hover:shadow-md hover:shadow-slate-200/60 sm:p-6 xl:row-start-2">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<h3 className="flex items-center gap-2.5 text-lg font-bold text-slate-950">
							<span className="application-detail-icon grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
								<FileText size={16} strokeWidth={2.4} />
							</span>
							Private Notes
						</h3>
						<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
							<Lock size={13} strokeWidth={2.5} />
							Only visible to you
						</span>
					</div>

					<Textarea
						value={notesDraft}
						onChange={(event) => setNotesDraft(event.target.value)}
						placeholder="Add notes about the role, required skills, or interview prep..."
						className="min-h-56"
					/>

					<div className="flex min-w-0 flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-xs font-semibold text-slate-400">
							{notesDraft.length.toLocaleString()} characters
						</p>

						<div className="flex min-w-0 flex-col-reverse gap-3 sm:flex-row">
							{notesHaveChanges && (
								<Button
									onClick={() =>
										setIsDiscardNotesModalOpen(true)
									}
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
					</div>
				</article>

				<article className="application-detail-panel flex min-w-0 max-w-full flex-col rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm shadow-slate-200/50 transition-shadow duration-200 hover:shadow-md hover:shadow-slate-200/60 sm:px-6 sm:py-7 row-start-2 xl:row-span-2">
					<h3 className="flex items-center gap-2.5 text-lg font-bold text-slate-950">
						<span className="application-detail-icon grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600">
							<MessageSquare size={16} strokeWidth={2.4} />
						</span>
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

							const isPastStep = !isCurrentStatus;
							const currentTimelineStatusClass = isCurrentStatus
								? `application-timeline-current-${status}`
								: "";

							return (
								<div
									key={`${status}-${index}`}
									className="relative pl-6"
								>
									<span
										className={[
											`absolute left-0 top-0.5 grid h-4 w-4 place-items-center rounded-full border z-10`,
											isCurrentStatus
												? `application-timeline-current-marker border-blue-500 bg-white ring-2 ring-blue-50 ${currentTimelineStatusClass}`
												: isPastStep
													? `application-timeline-past-marker ${applicationStatusBadgeClasses[
															status
														].replace(
															/\bbg-([a-z]+)-100\b/g,
															"bg-$1-900",
														)}`
													: "border-slate-300 bg-white",
										].join(" ")}
									>
										{isPastStep && (
											<Check
												size={7}
												strokeWidth={4}
												// className="text-white"
											/>
										)}
									</span>
									{!isLastItem && (
										<span
											className={
												"absolute left-[7.5px] top-4 h-[calc(100%+1rem)] w-[1.5px] bg-slate-200"
											}
										/>
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

					{upcomingStatuses.length > 0 && (
						<div className="mt-6 space-y-4 border-t border-dashed border-slate-200 pt-6">
							<p className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400">
								Up next in the pipeline
							</p>
							{upcomingStatuses.map((status) => (
								<div
									key={status}
									className="flex items-center gap-3"
								>
									<span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-dashed border-slate-300" />
									<p className="text-sm font-semibold text-slate-400">
										{applicationStatusLabels[status]}
									</p>
								</div>
							))}
						</div>
					)}
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
