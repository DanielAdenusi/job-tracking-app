import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getApplication } from "../services/applicationsApi";
import type { Application } from "../types/application";

export function ApplicationDetailsPage() {
	const { id } = useParams();

	const [application, setApplication] = useState<Application | null>(null);
	const [isLoading, setIsLoading] = useState(true);
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

	if (isLoading) {
		return (
			<section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
				<h3 className="font-extrabold">Loading application...</h3>
			</section>
		);
	}

	if (error || !application) {
		return (
			<section className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
				<h3 className="font-extrabold text-red-900">
					Application not found
				</h3>
				<p className="mt-2 text-red-700">
					{error || "This application does not exist."}
				</p>

				<div className="mt-5">
					<Link
						to="/applications"
						className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
					>
						Back to applications
					</Link>
				</div>
			</section>
		);
	}

	return (
		<section className="grid gap-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div>
					<h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
						{application.role}
					</h2>
					<p className="mt-2 leading-7 text-slate-600">
						{application.company}
						{application.location
							? ` · ${application.location}`
							: ""}
					</p>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row">
					<Link
						to={`/applications/${application.id}/edit`}
						className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
					>
						Edit
					</Link>

					<Link
						to="/applications"
						className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
					>
						Back
					</Link>
				</div>
			</div>

			<article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<dl className="grid gap-5 md:grid-cols-2">
					<div>
						<dt className="text-sm font-bold text-slate-500">
							Status
						</dt>
						<dd className="mt-1 font-extrabold">
							{application.status}
						</dd>
					</div>

					<div>
						<dt className="text-sm font-bold text-slate-500">
							Priority
						</dt>
						<dd className="mt-1 font-extrabold">
							{application.priority}
						</dd>
					</div>

					{application.workMode && (
						<div>
							<dt className="text-sm font-bold text-slate-500">
								Work mode
							</dt>
							<dd className="mt-1 font-extrabold">
								{application.workMode}
							</dd>
						</div>
					)}

					{application.employmentType && (
						<div>
							<dt className="text-sm font-bold text-slate-500">
								Employment type
							</dt>
							<dd className="mt-1 font-extrabold">
								{application.employmentType}
							</dd>
						</div>
					)}

					{application.followUpAt && (
						<div>
							<dt className="text-sm font-bold text-slate-500">
								Follow-up
							</dt>
							<dd className="mt-1 font-extrabold">
								{application.followUpAt}
							</dd>
						</div>
					)}

					{application.jobUrl && (
						<div>
							<dt className="text-sm font-bold text-slate-500">
								Job URL
							</dt>
							<dd className="mt-1">
								<a
									href={application.jobUrl}
									target="_blank"
									rel="noreferrer"
									className="font-bold text-blue-700 hover:underline"
								>
									Open job post
								</a>
							</dd>
						</div>
					)}
				</dl>

				{application.notes && (
					<div className="mt-6 rounded-2xl bg-slate-50 p-4">
						<p className="text-sm font-bold text-slate-500">
							Notes
						</p>
						<p className="mt-2 leading-7 text-slate-700">
							{application.notes}
						</p>
					</div>
				)}
			</article>
		</section>
	);
}
