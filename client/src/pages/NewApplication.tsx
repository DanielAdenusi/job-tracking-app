import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
	Download,
	FileSpreadsheet,
	Link2,
	ListPlus,
	WandSparkles,
} from "lucide-react";
import {
	ApplicationForm,
	type ApplicationFormValues,
} from "../components/ApplicationForm";
import {
	createApplication,
	extractApplicationFromUrl,
} from "../services/applicationsApi";
import type { CreateApplicationInput } from "../types/application";
import { PageHeading } from "../components/PageHeading";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/FormControls";
import { Card } from "../components/ui/Surface";
import { useToast } from "../components/ToastProvider";
import { parseApplicationsSpreadsheet } from "../services/applicationSpreadsheetImport";
import { downloadApplicationImportTemplate } from "../services/applicationImportTemplate";

const sampleCompanies = [
	"Northstar Labs",
	"Brightpath Finance",
	"SignalWorks",
	"GreenGrid Energy",
	"Orbit Retail",
	"Harbour Health",
	"PixelForge Studio",
	"Atlas Cloud",
];

const sampleRoles = [
	"Frontend Developer",
	"Junior Software Engineer",
	"Product Analyst",
	"Full Stack Developer",
	"Data Analyst",
	"QA Engineer",
	"UX Engineer",
	"Platform Engineer",
];

const sampleLocations = [
	"London",
	"Manchester",
	"Birmingham",
	"Remote",
	"Leeds",
	"Bristol",
];

const sampleSources = [
	"LinkedIn",
	"Indeed",
	"Company website",
	"Referral",
	"Gradcracker",
	"Handshake",
];

function pick<T>(items: T[], index: number) {
	return items[index % items.length];
}

function addDays(days: number) {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return date.toISOString().slice(0, 10);
}

function createSampleApplication(index = 0): CreateApplicationInput {
	const company = pick(sampleCompanies, index);
	const role = pick(sampleRoles, index + 2);

	return {
		company,
		role,
		location: pick(sampleLocations, index + 1),
		jobUrl: `https://example.com/jobs/${company
			.toLowerCase()
			.replaceAll(" ", "-")}-${index + 1}`,
		salary: `GBP ${28 + index * 3},000 - GBP ${36 + index * 4},000`,
		hoursPerWeek: "37.5",
		jobReferenceId: `JM-${String(index + 1).padStart(4, "0")}`,
		jobDescription: {
			role: [
				"Work on user-facing product features.",
				"Help improve the job tracking experience.",
			],
			keyResponsibilities: [
				"Build reliable UI components.",
				"Collaborate with product and design.",
			],
			lookingFor: [
				"Comfortable with React and TypeScript.",
				"Clear written communication.",
			],
			desirable: ["Experience with accessibility testing."],
			whyJoinUs: ["Supportive team and room to grow."],
		},
		status: pick(
			["wishlist", "saved", "applied", "assessment", "interviewing"],
			index,
		),
		priority: pick(["low", "medium", "high"], index + 1),
		employmentType: pick(
			["full_time", "internship", "placement", "contract"],
			index,
		),
		workMode: pick(["remote", "hybrid", "onsite"], index + 1),
		source: pick(sampleSources, index),
		contactName: `Recruiter ${index + 1}`,
		contactEmail: `recruiter${index + 1}@example.com`,
		notes: "Generated in development to test the application flow.",
		appliedAt: index % 2 === 0 ? addDays(-index - 1) : undefined,
		followUpAt: addDays(index + 3),
		deadlineAt: addDays(index + 14),
		interviewAt:
			index % 3 === 0 ? `${addDays(index + 7)}T10:00` : undefined,
	};
}

function applicationToFormValues(
	application: Partial<CreateApplicationInput>,
): Partial<ApplicationFormValues> {
	return {
		company: application.company ?? "",
		role: application.role ?? "",
		location: application.location ?? "",
		jobUrl: application.jobUrl ?? "",
		salary: application.salary ?? "",
		hoursPerWeek: application.hoursPerWeek ?? "",
		jobReferenceId: application.jobReferenceId ?? "",
		jobDescriptionRole: application.jobDescription?.role?.join("\n") ?? "",
		jobDescriptionResponsibilities:
			application.jobDescription?.keyResponsibilities?.join("\n") ?? "",
		jobDescriptionLookingFor:
			application.jobDescription?.lookingFor?.join("\n") ?? "",
		jobDescriptionDesirable:
			application.jobDescription?.desirable?.join("\n") ?? "",
		jobDescriptionWhyJoinUs:
			application.jobDescription?.whyJoinUs?.join("\n") ?? "",
		status: application.status ?? "saved",
		priority: application.priority ?? "medium",
		employmentType: application.employmentType ?? "",
		workMode: application.workMode ?? "",
		source: application.source ?? "",
		contactName: application.contactName ?? "",
		contactEmail: application.contactEmail ?? "",
		notes: application.notes ?? "",
		appliedAt: application.appliedAt ?? "",
		followUpAt: application.followUpAt ?? "",
		deadlineAt: application.deadlineAt ?? "",
		interviewAt: application.interviewAt ?? "",
		rejectedAt: application.rejectedAt ?? "",
		offerDeadlineAt: application.offerDeadlineAt ?? "",
	};
}

export function NewApplicationPage() {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const importInputRef = useRef<HTMLInputElement | null>(null);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isExtracting, setIsExtracting] = useState(false);
	const [urlToExtract, setUrlToExtract] = useState("");
	const [extractionMessage, setExtractionMessage] = useState<string | null>(
		null,
	);
	const [draftValues, setDraftValues] = useState<
		Partial<ApplicationFormValues> | undefined
	>();
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(data: CreateApplicationInput) {
		try {
			setError(null);
			setIsSubmitting(true);

			const application = await createApplication(data);

			navigate(`/applications/${application.id}`);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to create application",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleFillDetails() {
		setError(null);
		setDraftValues(applicationToFormValues(createSampleApplication()));
		showToast("Filled the form with development sample details.", "success");
	}

	async function handleExtractFromUrl(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			setError(null);
			setExtractionMessage(null);
			setIsExtracting(true);

			const result = await extractApplicationFromUrl(urlToExtract);
			const draft = applicationToFormValues({
				...result.application,
				jobUrl: result.application.jobUrl || urlToExtract,
			});

			setDraftValues(draft);
			setExtractionMessage(result.message);
			showToast("Extracted a draft application.", "success");
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Failed to extract that job URL.";

			setError(message);
			showToast(message, "error");
		} finally {
			setIsExtracting(false);
		}
	}

	async function handleGenerateApplications() {
		try {
			setError(null);
			setIsGenerating(true);

			await Promise.all(
				Array.from({ length: 5 }, (_, index) =>
					createApplication(createSampleApplication(index)),
				),
			);

			showToast("Generated 5 sample applications.", "success");
			navigate("/applications");
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Failed to generate sample applications.";

			setError(message);
			showToast(message, "error");
		} finally {
			setIsGenerating(false);
		}
	}

	async function handleImportApplications(file: File | undefined) {
		if (!file) return;

		try {
			setError(null);
			setIsImporting(true);

			const { applications, skippedRows } =
				await parseApplicationsSpreadsheet(file);

			if (applications.length === 0) {
				throw new Error(
					"Could not find any rows with both company and role.",
				);
			}

			await Promise.all(
				applications.map((application) =>
					createApplication(application),
				),
			);

			showToast(
				[
					`Imported ${applications.length} applications.`,
					skippedRows > 0
						? `Skipped ${skippedRows} rows missing company or role.`
						: null,
				]
					.filter(Boolean)
					.join(" "),
				"success",
			);
			navigate("/applications");
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Failed to import applications.";

			setError(message);
			showToast(message, "error");
		} finally {
			setIsImporting(false);

			if (importInputRef.current) {
				importInputRef.current.value = "";
			}
		}
	}

	async function handleDownloadTemplate() {
		try {
			setError(null);
			setIsDownloadingTemplate(true);
			await downloadApplicationImportTemplate();
			showToast("Downloaded the Excel import example.", "success");
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Failed to download the import example.";

			setError(message);
			showToast(message, "error");
		} finally {
			setIsDownloadingTemplate(false);
		}
	}

	const isBusy =
		isSubmitting ||
		isImporting ||
		isGenerating ||
		isDownloadingTemplate ||
		isExtracting;
	const headingActions = [
		...(import.meta.env.DEV
			? [
					{
						id: "fill-details",
						label: "Fill details",
						icon: WandSparkles,
						variant: "secondary" as const,
					},
					{
						id: "generate",
						label: isGenerating ? "Generating..." : "Generate 5",
						icon: ListPlus,
						variant: "secondary" as const,
					},
				]
			: []),
		{
			id: "download-template",
			label: isDownloadingTemplate ? "Downloading..." : "Download example",
			icon: Download,
			variant: "secondary" as const,
		},
		{
			id: "import",
			label: isImporting ? "Importing..." : "Import Excel",
			icon: FileSpreadsheet,
			variant: "secondary" as const,
		},
	];

	return (
		<section className="grid gap-6">
			<input
				ref={importInputRef}
				type="file"
				accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
				className="hidden"
				onChange={(event) =>
					void handleImportApplications(event.target.files?.[0])
				}
			/>
			<PageHeading
				eyebrow="Applications"
				title="New application"
				description="Add a new job application to your tracker."
				actions={headingActions}
				renderAction={(action) => (
					<Button
						key={action.label}
						variant={action.variant}
						icon={<action.icon size={16} strokeWidth={2.4} />}
						isLoading={
							(action.id === "import" && isImporting) ||
							(action.id === "generate" && isGenerating) ||
							(action.id === "download-template" &&
								isDownloadingTemplate)
						}
						disabled={isBusy}
						onClick={() => {
							if (action.id === "fill-details") {
								handleFillDetails();
								return;
							}

							if (action.id === "generate") {
								void handleGenerateApplications();
								return;
							}

							if (action.id === "download-template") {
								void handleDownloadTemplate();
								return;
							}

							importInputRef.current?.click();
						}}
					>
						{action.label}
					</Button>
				)}
			/>
			<Card className="p-6">
				<form
					className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end"
					onSubmit={(event) => void handleExtractFromUrl(event)}
				>
					<Field
						label="Paste a job URL"
						description="Extracts a draft from structured job-posting data and page metadata."
					>
						<TextInput
							type="url"
							value={urlToExtract}
							placeholder="https://company.com/jobs/frontend-developer"
							onChange={(event) =>
								setUrlToExtract(event.target.value)
							}
						/>
					</Field>
					<Button
						type="submit"
						variant="secondary"
						tone="neutral"
						icon={<Link2 size={16} strokeWidth={2.4} />}
						isLoading={isExtracting}
						disabled={isBusy || !urlToExtract.trim()}
						className="lg:mb-0"
					>
						{isExtracting ? "Extracting..." : "Extract details"}
					</Button>
				</form>
				{extractionMessage && (
					<div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm font-semibold leading-6 text-teal-900">
						{extractionMessage} Review the fields below before
						saving.
					</div>
				)}
			</Card>
			<ApplicationForm
				mode="create"
				initialValues={draftValues}
				error={error}
				isSubmitting={isSubmitting}
				onSubmit={handleSubmit}
			/>
		</section>
	);
}
