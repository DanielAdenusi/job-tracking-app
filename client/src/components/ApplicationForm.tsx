import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
	APPLICATION_PRIORITIES,
	APPLICATION_STATUSES,
	EMPLOYMENT_TYPES,
	WORK_MODES,
	type ApplicationPriority,
	type ApplicationStatus,
	type EmploymentType,
	type WorkMode,
} from "../constants/applicationOptions";
import { Button } from "./ui/Button";
import { Card } from "./ui/Surface";
import {
	Checkbox,
	Field,
	Select,
	Textarea,
	TextInput,
} from "./ui/FormControls";
import type {
	CreateApplicationInput,
	JobDescriptionSections,
} from "../types/application";

export type ApplicationFormValues = {
	company: string;
	role: string;
	location: string;
	jobUrl: string;
	salary: string;
	hoursPerWeek: string;
	jobReferenceId: string;
	status: ApplicationStatus;
	priority: ApplicationPriority;
	employmentType: EmploymentType | "";
	workMode: WorkMode | "";
	source: string;
	contactName: string;
	contactEmail: string;
	notes: string;
	jobDescriptionRole: string;
	jobDescriptionResponsibilities: string;
	jobDescriptionLookingFor: string;
	jobDescriptionDesirable: string;
	jobDescriptionWhyJoinUs: string;
	appliedAt: string;
	followUpAt: string;
	deadlineAt: string;
	interviewAt: string;
	interviewLocation: string;
	interviewMode: WorkMode | "";
	rejectedAt: string;
	offerDeadlineAt: string;
	notificationsEnabled: boolean;
	reminderLeadMinutes: string;
	secondReminderLeadMinutes: string;
};

type ApplicationFormProps = {
	mode: "create" | "edit";
	initialValues?: Partial<ApplicationFormValues>;
	isSubmitting?: boolean;
	error?: string | null;
	onSubmit: (data: CreateApplicationInput) => Promise<void>;
};

type FormSectionId =
	| "roleDetails"
	| "trackingDetails"
	| "jobDescription"
	| "dates"
	| "contactNotes";

const sectionFields: Record<FormSectionId, (keyof ApplicationFormValues)[]> = {
	roleDetails: [
		"company",
		"role",
		"location",
		"salary",
		"hoursPerWeek",
		"jobReferenceId",
		"jobUrl",
	],
	trackingDetails: [
		"status",
		"priority",
		"employmentType",
		"workMode",
		"source",
	],
	jobDescription: [
		"jobDescriptionRole",
		"jobDescriptionResponsibilities",
		"jobDescriptionLookingFor",
		"jobDescriptionDesirable",
		"jobDescriptionWhyJoinUs",
	],
	dates: [
		"appliedAt",
		"followUpAt",
		"deadlineAt",
		"interviewAt",
		"interviewLocation",
		"interviewMode",
		"rejectedAt",
		"offerDeadlineAt",
		"notificationsEnabled",
		"reminderLeadMinutes",
		"secondReminderLeadMinutes",
	],
	contactNotes: ["contactName", "contactEmail", "notes"],
};

function formatOption(value: string) {
	return value
		.split("_")
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
}

function dateInputValue(value?: string | null) {
	if (!value) return "";
	return value.slice(0, 10);
}

function dateTimeLocalInputValue(value?: string | null) {
	if (!value) return "";

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) return "";

	const offset = date.getTimezoneOffset();
	const localDate = new Date(date.getTime() - offset * 60 * 1000);

	return localDate.toISOString().slice(0, 16);
}

function emptyToUndefined(value: string) {
	return value.trim() === "" ? undefined : value.trim();
}

function optionalReminderMinutes(value: string) {
	return value === "" ? undefined : Number(value);
}

function parseListText(value: string) {
	return value
		.split(/\r?\n/)
		.map((line) =>
			line
				.trim()
				.replace(/^[-*•]\s+/, "")
				.replace(/^\d+[.)]\s+/, "")
				.trim(),
		)
		.filter(Boolean);
}

function buildJobDescription(values: ApplicationFormValues) {
	const jobDescription: JobDescriptionSections = {
		role: parseListText(values.jobDescriptionRole),
		keyResponsibilities: parseListText(
			values.jobDescriptionResponsibilities,
		),
		lookingFor: parseListText(values.jobDescriptionLookingFor),
		desirable: parseListText(values.jobDescriptionDesirable),
		whyJoinUs: parseListText(values.jobDescriptionWhyJoinUs),
	};

	return Object.values(jobDescription).some((items) => items.length > 0)
		? jobDescription
		: undefined;
}

function FormSection({
	children,
	description,
	isCollapsed,
	onToggle,
	title,
}: {
	children: ReactNode;
	description: string;
	isCollapsed: boolean;
	onToggle: () => void;
	title: string;
}) {
	return (
		<Card className="p-6">
			<button
				type="button"
				onClick={onToggle}
				aria-expanded={!isCollapsed}
				className="flex w-full items-start justify-between gap-4 rounded-lg text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--app-accent-ring)"
			>
				<span>
					<h3 className="text-lg font-extrabold">{title}</h3>
					<p className="mt-1 text-sm text-slate-500">{description}</p>
				</span>
				<span
					className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold text-slate-600 transition"
					aria-hidden="true"
				>
					{isCollapsed ? (
						<ChevronDown size={15} strokeWidth={2.5} />
					) : (
						<ChevronUp size={15} strokeWidth={2.5} />
					)}
					<span className="hidden sm:inline">
						{isCollapsed ? "Show" : "Hide"}
					</span>
				</span>
			</button>
			{!isCollapsed && (
				<div className="mt-6 grid gap-5 md:grid-cols-2">{children}</div>
			)}
		</Card>
	);
}

type TextFieldProps = {
	field: keyof ApplicationFormValues;
	label: string;
	value: string;
	error?: string;
	placeholder?: string;
	required?: boolean;
	type?: string;
	className?: string;
	onChange: (value: string) => void;
};

function TextField({
	className,
	error,
	field,
	label,
	onChange,
	placeholder,
	required,
	type,
	value,
}: TextFieldProps) {
	return (
		<Field
			className={className}
			error={error}
			label={label}
			required={required}
		>
			<TextInput
				name={field}
				type={type}
				value={value}
				placeholder={placeholder}
				onChange={(event) => onChange(event.target.value)}
			/>
		</Field>
	);
}

const defaultValues: ApplicationFormValues = {
	company: "",
	role: "",
	location: "",
	jobUrl: "",
	salary: "",
	hoursPerWeek: "",
	jobReferenceId: "",
	status: "saved",
	priority: "medium",
	employmentType: "",
	workMode: "",
	source: "",
	contactName: "",
	contactEmail: "",
	notes: "",
	jobDescriptionRole: "",
	jobDescriptionResponsibilities: "",
	jobDescriptionLookingFor: "",
	jobDescriptionDesirable: "",
	jobDescriptionWhyJoinUs: "",
	appliedAt: "",
	followUpAt: "",
	deadlineAt: "",
	interviewAt: "",
	interviewLocation: "",
	interviewMode: "",
	rejectedAt: "",
	offerDeadlineAt: "",
	notificationsEnabled: false,
	reminderLeadMinutes: "1440",
	secondReminderLeadMinutes: "",
};

const reminderOptions = [
	{ label: "At the time", value: "0" },
	{ label: "30 minutes before", value: "30" },
	{ label: "1 hour before", value: "60" },
	{ label: "1 day before", value: "1440" },
	{ label: "3 days before", value: "4320" },
	{ label: "1 week before", value: "10080" },
] as const;

export function ApplicationForm({
	error,
	initialValues,
	isSubmitting = false,
	mode,
	onSubmit,
}: ApplicationFormProps) {
	const startingValues = useMemo(
		() => ({
			...defaultValues,
			...initialValues,
		}),
		[initialValues],
	);

	const [values, setValues] = useState<ApplicationFormValues>(startingValues);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [collapsedSections, setCollapsedSections] = useState<
		Record<FormSectionId, boolean>
	>({
		roleDetails: false,
		trackingDetails: true,
		jobDescription: true,
		dates: true,
		contactNotes: true,
	});

	useEffect(() => {
		setValues(startingValues);
		setFieldErrors({});
	}, [startingValues]);

	function updateField<K extends keyof ApplicationFormValues>(
		field: K,
		value: ApplicationFormValues[K],
	) {
		setValues((current) => ({
			...current,
			[field]: value,
		}));

		setFieldErrors((current) => ({
			...current,
			[field]: "",
		}));
	}

	function toggleSection(section: FormSectionId) {
		setCollapsedSections((current) => ({
			...current,
			[section]: !current[section],
		}));
	}

	function openSectionsForErrors(errors: Record<string, string>) {
		const erroredFields = new Set(Object.keys(errors));

		setCollapsedSections((current) => {
			const next = { ...current };

			for (const [section, fields] of Object.entries(sectionFields) as [
				FormSectionId,
				(keyof ApplicationFormValues)[],
			][]) {
				if (fields.some((field) => erroredFields.has(field))) {
					next[section] = false;
				}
			}

			return next;
		});
	}

	function validateForm() {
		const errors: Record<string, string> = {};

		if (!values.company.trim()) errors.company = "Company is required";
		if (!values.role.trim()) errors.role = "Role is required";

		if (values.jobUrl.trim() && !values.jobUrl.startsWith("http")) {
			errors.jobUrl = "Job URL must start with http:// or https://";
		}

		if (
			values.contactEmail.trim() &&
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail)
		) {
			errors.contactEmail = "Enter a valid email address";
		}

		setFieldErrors(errors);
		openSectionsForErrors(errors);

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!validateForm()) return;

		await onSubmit({
			company: values.company.trim(),
			role: values.role.trim(),
			location: emptyToUndefined(values.location),
			jobUrl: emptyToUndefined(values.jobUrl),
			salary: emptyToUndefined(values.salary),
			hoursPerWeek: emptyToUndefined(values.hoursPerWeek),
			jobReferenceId: emptyToUndefined(values.jobReferenceId),
			jobDescription: buildJobDescription(values),
			status: values.status,
			priority: values.priority,
			employmentType: values.employmentType,
			workMode: values.workMode,
			source: emptyToUndefined(values.source),
			contactName: emptyToUndefined(values.contactName),
			contactEmail: emptyToUndefined(values.contactEmail),
			notes: emptyToUndefined(values.notes),
			appliedAt: emptyToUndefined(values.appliedAt),
			followUpAt: emptyToUndefined(values.followUpAt),
			deadlineAt: emptyToUndefined(values.deadlineAt),
			interviewAt: emptyToUndefined(values.interviewAt),
			interviewLocation: emptyToUndefined(values.interviewLocation),
			interviewMode: values.interviewMode,
			rejectedAt: emptyToUndefined(values.rejectedAt),
			offerDeadlineAt: emptyToUndefined(values.offerDeadlineAt),
			notificationsEnabled: values.notificationsEnabled,
			reminderLeadMinutes: values.notificationsEnabled
				? optionalReminderMinutes(values.reminderLeadMinutes)
				: undefined,
			secondReminderLeadMinutes:
				values.notificationsEnabled &&
				values.secondReminderLeadMinutes !== ""
					? optionalReminderMinutes(values.secondReminderLeadMinutes)
					: undefined,
		});
	}

	const submitLabel = isSubmitting
		? mode === "create"
			? "Creating..."
			: "Saving..."
		: mode === "create"
			? "Create application"
			: "Save changes";
	const showAppliedDate = [
		"applied",
		"assessment",
		"interviewing",
		"offer",
		"rejected",
		"withdrawn",
	].includes(values.status);
	const showApplicationDeadline = [
		"wishlist",
		"saved",
		"applied",
		"assessment",
		"interviewing",
	].includes(values.status);
	const showFollowUpDate = values.status === "saved" || values.status === "applied";
	const showAssessmentDueDate = values.status === "assessment";
	const showInterviewFields = values.status === "interviewing";
	const showRejectedDate = values.status === "rejected";
	const showOfferDeadline = values.status === "offer";

	return (
		<form onSubmit={handleSubmit} className="grid gap-6">
			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-5">
					<p className="font-bold text-red-900">{error}</p>
				</div>
			)}

			<FormSection
				title="Role details"
				description="Add the core information about the job you are tracking."
				isCollapsed={collapsedSections.roleDetails}
				onToggle={() => toggleSection("roleDetails")}
			>
				<TextField
					field="company"
					label="Company"
					value={values.company}
					required
					error={fieldErrors.company}
					placeholder="e.g. Spotify"
					onChange={(value) => updateField("company", value)}
				/>
				<TextField
					field="role"
					label="Role"
					value={values.role}
					required
					error={fieldErrors.role}
					placeholder="e.g. Frontend Developer"
					onChange={(value) => updateField("role", value)}
				/>
				<TextField
					field="location"
					label="Location"
					value={values.location}
					placeholder="e.g. London"
					onChange={(value) => updateField("location", value)}
				/>
				<TextField
					field="salary"
					label="Salary"
					value={values.salary}
					placeholder="e.g. GBP 30,000 - GBP 40,000"
					onChange={(value) => updateField("salary", value)}
				/>
				<TextField
					field="hoursPerWeek"
					label="Hours per week"
					value={values.hoursPerWeek}
					placeholder="e.g. 37.5"
					onChange={(value) => updateField("hoursPerWeek", value)}
				/>
				<TextField
					field="jobReferenceId"
					label="Job reference ID"
					value={values.jobReferenceId}
					placeholder="e.g. JR-12345"
					onChange={(value) => updateField("jobReferenceId", value)}
				/>
				<TextField
					className="md:col-span-2"
					field="jobUrl"
					label="Job URL"
					value={values.jobUrl}
					error={fieldErrors.jobUrl}
					placeholder="https://example.com/job"
					onChange={(value) => updateField("jobUrl", value)}
				/>
			</FormSection>

			<FormSection
				title="Job description"
				description="Paste the job advert sections here. Each line becomes a list item on the application details page."
				isCollapsed={collapsedSections.jobDescription}
				onToggle={() => toggleSection("jobDescription")}
			>
				<Field className="md:col-span-2" label="The role">
					<Textarea
						value={values.jobDescriptionRole}
						onChange={(event) =>
							updateField(
								"jobDescriptionRole",
								event.target.value,
							)
						}
						placeholder="Paste role summary bullets or paragraphs, one point per line..."
						rows={3}
					/>
				</Field>
				<Field className="md:col-span-2" label="Key responsibilities">
					<Textarea
						value={values.jobDescriptionResponsibilities}
						onChange={(event) =>
							updateField(
								"jobDescriptionResponsibilities",
								event.target.value,
							)
						}
						placeholder="Build user interfaces&#10;Collaborate with product and design&#10;Review code"
						rows={3}
					/>
				</Field>
				<Field className="md:col-span-2" label="What we're looking for">
					<Textarea
						value={values.jobDescriptionLookingFor}
						onChange={(event) =>
							updateField(
								"jobDescriptionLookingFor",
								event.target.value,
							)
						}
						placeholder="Paste required skills, experience, or qualities..."
						rows={3}
					/>
				</Field>
				<Field className="md:col-span-2" label="Desirable">
					<Textarea
						value={values.jobDescriptionDesirable}
						onChange={(event) =>
							updateField(
								"jobDescriptionDesirable",
								event.target.value,
							)
						}
						placeholder="Paste nice-to-have skills or experience..."
						rows={3}
					/>
				</Field>
				<Field className="md:col-span-2" label="Why join us?">
					<Textarea
						value={values.jobDescriptionWhyJoinUs}
						onChange={(event) =>
							updateField(
								"jobDescriptionWhyJoinUs",
								event.target.value,
							)
						}
						placeholder="Paste benefits, culture, learning, progression, or mission details..."
						rows={3}
					/>
				</Field>
			</FormSection>

			<FormSection
				title="Tracking details"
				description="Set the current stage, priority, work mode, and source."
				isCollapsed={collapsedSections.trackingDetails}
				onToggle={() => toggleSection("trackingDetails")}
			>
				<Field label="Status">
					<Select
						value={values.status}
						onChange={(event) =>
							updateField(
								"status",
								event.target.value as ApplicationStatus,
							)
						}
					>
						{APPLICATION_STATUSES.map((status) => (
							<option key={status} value={status}>
								{formatOption(status)}
							</option>
						))}
					</Select>
				</Field>
				<Field label="Priority">
					<Select
						value={values.priority}
						onChange={(event) =>
							updateField(
								"priority",
								event.target.value as ApplicationPriority,
							)
						}
					>
						{APPLICATION_PRIORITIES.map((priority) => (
							<option key={priority} value={priority}>
								{formatOption(priority)}
							</option>
						))}
					</Select>
				</Field>
				<Field label="Employment type">
					<Select
						value={values.employmentType}
						onChange={(event) =>
							updateField(
								"employmentType",
								event.target.value as EmploymentType | "",
							)
						}
					>
						<option value="">Not set</option>
						{EMPLOYMENT_TYPES.map((type) => (
							<option key={type} value={type}>
								{formatOption(type)}
							</option>
						))}
					</Select>
				</Field>
				<Field label="Work mode">
					<Select
						value={values.workMode}
						onChange={(event) =>
							updateField(
								"workMode",
								event.target.value as WorkMode | "",
							)
						}
					>
						<option value="">Not set</option>
						{WORK_MODES.map((mode) => (
							<option key={mode} value={mode}>
								{formatOption(mode)}
							</option>
						))}
					</Select>
				</Field>
				<TextField
					className="md:col-span-2"
					field="source"
					label="Source"
					value={values.source}
					placeholder="e.g. LinkedIn, Indeed, company website, referral"
					onChange={(value) => updateField("source", value)}
				/>
			</FormSection>

			<FormSection
				title="Dates"
				description="Add the dates that matter for the selected status, then set reminders if you want the app to notify you."
				isCollapsed={collapsedSections.dates}
				onToggle={() => toggleSection("dates")}
			>
				{showAppliedDate && (
					<TextField
						field="appliedAt"
						label="Applied date"
						type="date"
						value={values.appliedAt}
						onChange={(value) => updateField("appliedAt", value)}
					/>
				)}
				{showApplicationDeadline && (
					<TextField
						field="deadlineAt"
						label="Application deadline"
						type="date"
						value={values.deadlineAt}
						onChange={(value) => updateField("deadlineAt", value)}
					/>
				)}
				{showFollowUpDate && (
					<TextField
						field="followUpAt"
						label="Follow-up date"
						type="date"
						value={values.followUpAt}
						onChange={(value) => updateField("followUpAt", value)}
					/>
				)}
				{showAssessmentDueDate && (
					<TextField
						field="followUpAt"
						label="Assessment due date"
						type="date"
						value={values.followUpAt}
						onChange={(value) => updateField("followUpAt", value)}
					/>
				)}
				{showInterviewFields && (
					<>
						<TextField
							field="interviewAt"
							label="Interview date/time"
							type="datetime-local"
							value={values.interviewAt}
							onChange={(value) =>
								updateField("interviewAt", value)
							}
						/>
						<TextField
							field="interviewLocation"
							label="Interview location or link"
							value={values.interviewLocation}
							placeholder="e.g. Google Meet link, London office, phone call"
							onChange={(value) =>
								updateField("interviewLocation", value)
							}
						/>
						<Field label="Interview mode">
							<Select
								value={values.interviewMode}
								onChange={(event) =>
									updateField(
										"interviewMode",
										event.target.value as WorkMode | "",
									)
								}
							>
								<option value="">Use work mode / not set</option>
								{WORK_MODES.map((mode) => (
									<option key={mode} value={mode}>
										{formatOption(mode)}
									</option>
								))}
							</Select>
						</Field>
					</>
				)}
				{showRejectedDate && (
					<TextField
						field="rejectedAt"
						label="Rejected date"
						type="date"
						value={values.rejectedAt}
						onChange={(value) => updateField("rejectedAt", value)}
					/>
				)}
				{showOfferDeadline && (
					<TextField
						field="offerDeadlineAt"
						label="Offer deadline"
						type="date"
						value={values.offerDeadlineAt}
						onChange={(value) =>
							updateField("offerDeadlineAt", value)
						}
					/>
				)}
				<div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
					<Checkbox
						checked={values.notificationsEnabled}
						onChange={(checked) =>
							updateField("notificationsEnabled", checked)
						}
						label="Send browser reminders for this application"
					/>
					<div className="grid gap-4 md:grid-cols-2">
						<Field label="First reminder">
							<Select
								value={values.reminderLeadMinutes}
								disabled={!values.notificationsEnabled}
								onChange={(event) =>
									updateField(
										"reminderLeadMinutes",
										event.target.value,
									)
								}
							>
								{reminderOptions.map((option) => (
									<option
										key={option.value}
										value={option.value}
									>
										{option.label}
									</option>
								))}
							</Select>
						</Field>
						<Field label="Second reminder">
							<Select
								value={values.secondReminderLeadMinutes}
								disabled={!values.notificationsEnabled}
								onChange={(event) =>
									updateField(
										"secondReminderLeadMinutes",
										event.target.value,
									)
								}
							>
								<option value="">No second reminder</option>
								{reminderOptions.map((option) => (
									<option
										key={option.value}
										value={option.value}
									>
										{option.label}
									</option>
								))}
							</Select>
						</Field>
					</div>
					<p className="text-xs font-medium leading-5 text-slate-500">
						Reminders are scheduled from the dated milestones
						available for this status when this browser has
						notification permission.
					</p>
				</div>
			</FormSection>

			<FormSection
				title="Contact and notes"
				description="Store recruiter contact details and anything useful for follow-up."
				isCollapsed={collapsedSections.contactNotes}
				onToggle={() => toggleSection("contactNotes")}
			>
				<TextField
					field="contactName"
					label="Contact name"
					value={values.contactName}
					placeholder="e.g. Jane Smith"
					onChange={(value) => updateField("contactName", value)}
				/>
				<TextField
					field="contactEmail"
					label="Contact email"
					value={values.contactEmail}
					error={fieldErrors.contactEmail}
					placeholder="jane@example.com"
					onChange={(value) => updateField("contactEmail", value)}
				/>
				<Field className="md:col-span-2" label="Notes">
					<Textarea
						value={values.notes}
						onChange={(event) =>
							updateField("notes", event.target.value)
						}
						placeholder="Interview notes, application details, recruiter messages, next steps..."
						rows={6}
					/>
				</Field>
			</FormSection>

			<div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
				<Button
					type="submit"
					variant="primary"
					tone="accent"
					size="lg"
					disabled={isSubmitting}
				>
					{submitLabel}
				</Button>
			</div>
		</form>
	);
}

export const applicationFormHelpers = {
	dateInputValue,
	dateTimeLocalInputValue,
};
