import { useMemo, useState } from "react";
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
import type { CreateApplicationInput } from "../types/application";

export type ApplicationFormValues = {
	company: string;
	role: string;
	location: string;
	jobUrl: string;
	salary: string;
	status: ApplicationStatus;
	priority: ApplicationPriority;
	employmentType: EmploymentType | "";
	workMode: WorkMode | "";
	source: string;
	contactName: string;
	contactEmail: string;
	notes: string;
	appliedAt: string;
	followUpAt: string;
	deadlineAt: string;
	interviewAt: string;
	rejectedAt: string;
	offerDeadlineAt: string;
};

type ApplicationFormProps = {
	mode: "create" | "edit";
	initialValues?: Partial<ApplicationFormValues>;
	isSubmitting?: boolean;
	error?: string | null;
	onSubmit: (data: CreateApplicationInput) => Promise<void>;
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

	if (Number.isNaN(date.getTime())) {
		return "";
	}

	const offset = date.getTimezoneOffset();
	const localDate = new Date(date.getTime() - offset * 60 * 1000);

	return localDate.toISOString().slice(0, 16);
}

function emptyToUndefined(value: string) {
	return value.trim() === "" ? undefined : value.trim();
}

const defaultValues: ApplicationFormValues = {
	company: "",
	role: "",
	location: "",
	jobUrl: "",
	salary: "",
	status: "saved",
	priority: "medium",
	employmentType: "",
	workMode: "",
	source: "",
	contactName: "",
	contactEmail: "",
	notes: "",
	appliedAt: "",
	followUpAt: "",
	deadlineAt: "",
	interviewAt: "",
	rejectedAt: "",
	offerDeadlineAt: "",
};

export function ApplicationForm({
	mode,
	initialValues,
	isSubmitting = false,
	error,
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

	function validateForm() {
		const errors: Record<string, string> = {};

		if (!values.company.trim()) {
			errors.company = "Company is required";
		}

		if (!values.role.trim()) {
			errors.role = "Role is required";
		}

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

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!validateForm()) {
			return;
		}

		await onSubmit({
			company: values.company.trim(),
			role: values.role.trim(),
			location: emptyToUndefined(values.location),
			jobUrl: emptyToUndefined(values.jobUrl),
			salary: emptyToUndefined(values.salary),
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
			rejectedAt: emptyToUndefined(values.rejectedAt),
			offerDeadlineAt: emptyToUndefined(values.offerDeadlineAt),
		});
	}

	return (
		<form onSubmit={handleSubmit} className="grid gap-6">
			{error && (
				<div className="rounded-3xl border border-red-200 bg-red-50 p-5">
					<p className="font-bold text-red-900">{error}</p>
				</div>
			)}

			<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div>
					<h3 className="text-lg font-extrabold">Role details</h3>
					<p className="mt-1 text-sm text-slate-500">
						Add the core information about the job you are tracking.
					</p>
				</div>

				<div className="mt-6 grid gap-5 md:grid-cols-2">
					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Company <span className="text-red-600">*</span>
						</span>
						<input
							value={values.company}
							onChange={(event) =>
								updateField("company", event.target.value)
							}
							placeholder="e.g. Spotify"
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
						{fieldErrors.company && (
							<span className="text-sm font-semibold text-red-600">
								{fieldErrors.company}
							</span>
						)}
					</label>

					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Role <span className="text-red-600">*</span>
						</span>
						<input
							value={values.role}
							onChange={(event) =>
								updateField("role", event.target.value)
							}
							placeholder="e.g. Frontend Developer"
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
						{fieldErrors.role && (
							<span className="text-sm font-semibold text-red-600">
								{fieldErrors.role}
							</span>
						)}
					</label>

					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Location
						</span>
						<input
							value={values.location}
							onChange={(event) =>
								updateField("location", event.target.value)
							}
							placeholder="e.g. London"
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
					</label>

					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Salary
						</span>
						<input
							value={values.salary}
							onChange={(event) =>
								updateField("salary", event.target.value)
							}
							placeholder="e.g. £30,000 - £40,000"
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
					</label>

					<label className="grid gap-2 md:col-span-2">
						<span className="text-sm font-bold text-slate-700">
							Job URL
						</span>
						<input
							value={values.jobUrl}
							onChange={(event) =>
								updateField("jobUrl", event.target.value)
							}
							placeholder="https://example.com/job"
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
						{fieldErrors.jobUrl && (
							<span className="text-sm font-semibold text-red-600">
								{fieldErrors.jobUrl}
							</span>
						)}
					</label>
				</div>
			</section>

			<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div>
					<h3 className="text-lg font-extrabold">Tracking details</h3>
					<p className="mt-1 text-sm text-slate-500">
						Set the current stage, priority, work mode, and source.
					</p>
				</div>

				<div className="mt-6 grid gap-5 md:grid-cols-2">
					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Status
						</span>
						<select
							value={values.status}
							onChange={(event) =>
								updateField(
									"status",
									event.target.value as ApplicationStatus,
								)
							}
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						>
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
							value={values.priority}
							onChange={(event) =>
								updateField(
									"priority",
									event.target.value as ApplicationPriority,
								)
							}
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						>
							{APPLICATION_PRIORITIES.map((priority) => (
								<option key={priority} value={priority}>
									{formatOption(priority)}
								</option>
							))}
						</select>
					</label>

					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Employment type
						</span>
						<select
							value={values.employmentType}
							onChange={(event) =>
								updateField(
									"employmentType",
									event.target.value as EmploymentType | "",
								)
							}
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						>
							<option value="">Not set</option>
							{EMPLOYMENT_TYPES.map((type) => (
								<option key={type} value={type}>
									{formatOption(type)}
								</option>
							))}
						</select>
					</label>

					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Work mode
						</span>
						<select
							value={values.workMode}
							onChange={(event) =>
								updateField(
									"workMode",
									event.target.value as WorkMode | "",
								)
							}
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						>
							<option value="">Not set</option>
							{WORK_MODES.map((mode) => (
								<option key={mode} value={mode}>
									{formatOption(mode)}
								</option>
							))}
						</select>
					</label>

					<label className="grid gap-2 md:col-span-2">
						<span className="text-sm font-bold text-slate-700">
							Source
						</span>
						<input
							value={values.source}
							onChange={(event) =>
								updateField("source", event.target.value)
							}
							placeholder="e.g. LinkedIn, Indeed, company website, referral"
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
					</label>
				</div>
			</section>

			<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div>
					<h3 className="text-lg font-extrabold">Dates</h3>
					<p className="mt-1 text-sm text-slate-500">
						Add deadlines, follow-ups, interviews, and outcome
						dates.
					</p>
				</div>

				<div className="mt-6 grid gap-5 md:grid-cols-2">
					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Applied date
						</span>
						<input
							type="date"
							value={values.appliedAt}
							onChange={(event) =>
								updateField("appliedAt", event.target.value)
							}
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
					</label>

					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Follow-up date
						</span>
						<input
							type="date"
							value={values.followUpAt}
							onChange={(event) =>
								updateField("followUpAt", event.target.value)
							}
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
					</label>

					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Application deadline
						</span>
						<input
							type="date"
							value={values.deadlineAt}
							onChange={(event) =>
								updateField("deadlineAt", event.target.value)
							}
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
					</label>

					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Interview date/time
						</span>
						<input
							type="datetime-local"
							value={values.interviewAt}
							onChange={(event) =>
								updateField("interviewAt", event.target.value)
							}
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
					</label>

					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Rejected date
						</span>
						<input
							type="date"
							value={values.rejectedAt}
							onChange={(event) =>
								updateField("rejectedAt", event.target.value)
							}
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
					</label>

					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Offer deadline
						</span>
						<input
							type="date"
							value={values.offerDeadlineAt}
							onChange={(event) =>
								updateField(
									"offerDeadlineAt",
									event.target.value,
								)
							}
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
					</label>
				</div>
			</section>

			<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div>
					<h3 className="text-lg font-extrabold">
						Contact and notes
					</h3>
					<p className="mt-1 text-sm text-slate-500">
						Store recruiter contact details and anything useful for
						follow-up.
					</p>
				</div>

				<div className="mt-6 grid gap-5 md:grid-cols-2">
					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Contact name
						</span>
						<input
							value={values.contactName}
							onChange={(event) =>
								updateField("contactName", event.target.value)
							}
							placeholder="e.g. Jane Smith"
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
					</label>

					<label className="grid gap-2">
						<span className="text-sm font-bold text-slate-700">
							Contact email
						</span>
						<input
							value={values.contactEmail}
							onChange={(event) =>
								updateField("contactEmail", event.target.value)
							}
							placeholder="jane@example.com"
							className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
						{fieldErrors.contactEmail && (
							<span className="text-sm font-semibold text-red-600">
								{fieldErrors.contactEmail}
							</span>
						)}
					</label>

					<label className="grid gap-2 md:col-span-2">
						<span className="text-sm font-bold text-slate-700">
							Notes
						</span>
						<textarea
							value={values.notes}
							onChange={(event) =>
								updateField("notes", event.target.value)
							}
							placeholder="Interview notes, application details, recruiter messages, next steps..."
							rows={6}
							className="resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-7 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
						/>
					</label>
				</div>
			</section>

			<div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
				<button
					type="submit"
					disabled={isSubmitting}
					className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isSubmitting
						? mode === "create"
							? "Creating..."
							: "Saving..."
						: mode === "create"
							? "Create application"
							: "Save changes"}
				</button>
			</div>
		</form>
	);
}

export const applicationFormHelpers = {
	dateInputValue,
	dateTimeLocalInputValue,
};
