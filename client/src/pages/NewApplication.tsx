import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ApplicationForm } from "../components/ApplicationForm";
import { createApplication } from "../services/applicationsApi";
import type { CreateApplicationInput } from "../types/application";

export function NewApplicationPage() {
	const navigate = useNavigate();

	const [isSubmitting, setIsSubmitting] = useState(false);
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

	return (
		<section className="grid gap-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div>
					<h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
						Add application
					</h2>
					<p className="mt-2 max-w-2xl leading-7 text-slate-600">
						Add a role to your tracker so you can monitor progress,
						follow-ups, interviews, and outcomes.
					</p>
				</div>

				<Link
					to="/applications"
					className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
				>
					Back to applications
				</Link>
			</div>

			<ApplicationForm
				mode="create"
				error={error}
				isSubmitting={isSubmitting}
				onSubmit={handleSubmit}
			/>
		</section>
	);
}
