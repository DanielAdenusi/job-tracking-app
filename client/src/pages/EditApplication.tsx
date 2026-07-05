import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getApplication, updateApplication } from "../services/applicationsApi";
import {
	ApplicationForm,
	applicationFormHelpers,
	type ApplicationFormValues,
} from "../components/ApplicationForm";
import type { Application, CreateApplicationInput } from "../types/application";

export function EditApplicationPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	const [application, setApplication] = useState<Application | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
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

	const initialValues = useMemo<
		Partial<ApplicationFormValues> | undefined
	>(() => {
		if (!application) return undefined;

		return {
			company: application.company,
			role: application.role,
			location: application.location ?? "",
			jobUrl: application.jobUrl ?? "",
			salary: application.salary ?? "",
			hoursPerWeek: application.hoursPerWeek ?? "",
			jobReferenceId: application.jobReferenceId ?? "",
			jobDescriptionRole:
				application.jobDescription?.role?.join("\n") ?? "",
			jobDescriptionResponsibilities:
				application.jobDescription?.keyResponsibilities?.join("\n") ??
				"",
			jobDescriptionLookingFor:
				application.jobDescription?.lookingFor?.join("\n") ?? "",
			jobDescriptionDesirable:
				application.jobDescription?.desirable?.join("\n") ?? "",
			jobDescriptionWhyJoinUs:
				application.jobDescription?.whyJoinUs?.join("\n") ?? "",
			status: application.status,
			priority: application.priority,
			employmentType: application.employmentType ?? "",
			workMode: application.workMode ?? "",
			source: application.source ?? "",
			contactName: application.contactName ?? "",
			contactEmail: application.contactEmail ?? "",
			notes: application.notes ?? "",
			appliedAt: applicationFormHelpers.dateInputValue(
				application.appliedAt,
			),
			followUpAt: applicationFormHelpers.dateInputValue(
				application.followUpAt,
			),
			deadlineAt: applicationFormHelpers.dateInputValue(
				application.deadlineAt,
			),
			interviewAt: applicationFormHelpers.dateTimeLocalInputValue(
				application.interviewAt,
			),
			rejectedAt: applicationFormHelpers.dateInputValue(
				application.rejectedAt,
			),
			offerDeadlineAt: applicationFormHelpers.dateInputValue(
				application.offerDeadlineAt,
			),
		};
	}, [application]);

	async function handleSubmit(data: CreateApplicationInput) {
		if (!id) return;

		try {
			setError(null);
			setIsSubmitting(true);

			const updatedApplication = await updateApplication(id, data);

			window.dispatchEvent(new Event("applications:changed"));
			navigate(`/applications/${updatedApplication.id}`);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to update application",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	if (isLoading) {
		return (
			<section className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm shadow-slate-200/40">
				<div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
				<p className="mt-4 font-bold text-slate-700">
					Loading application...
				</p>
			</section>
		);
	}

	if (error && !application) {
		return (
			<section className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
				<h2 className="text-lg font-extrabold text-red-900">
					Application failed to load
				</h2>
				<p className="mt-2 text-red-700">{error}</p>

				<Link
					to="/applications"
					className="mt-5 inline-flex h-11 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition hover:bg-red-100"
				>
					Back to applications
				</Link>
			</section>
		);
	}

	if (!application || !initialValues) {
		return null;
	}

	return (
		<section className="grid gap-6">
			<ApplicationForm
				mode="edit"
				initialValues={initialValues}
				error={error}
				isSubmitting={isSubmitting}
				onSubmit={handleSubmit}
			/>
		</section>
	);
}
