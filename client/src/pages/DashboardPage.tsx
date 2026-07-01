import { useEffect, useState } from "react";
import { logout } from "../features/auth/authService";
import {
	getApplications,
	updateApplicationStatus,
} from "../features/applications/applicationService";
import type { ApplicationStatus, JobApplication } from "../types/application";
import AddApplicationForm from "../components/applications/AddApplicationForm";
import KanbanBoard from "../components/applications/KanbanBoard";

export default function DashboardPage() {
	const [applications, setApplications] = useState<JobApplication[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	async function loadApplications() {
		try {
			setIsLoading(true);
			setError("");

			const data = await getApplications();
			setApplications(data);
		} catch (error) {
			console.error("Load applications failed:", error);
			setError(
				error instanceof Error
					? error.message
					: "Failed to load applications.",
			);
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		loadApplications();
	}, []);

	function handleApplicationCreated(application: JobApplication) {
		setApplications((currentApplications) => [
			application,
			...currentApplications,
		]);
	}

	async function handleStatusChange(id: string, status: ApplicationStatus) {
		try {
			const updatedApplication = await updateApplicationStatus(
				id,
				status,
			);

			setApplications((currentApplications) =>
				currentApplications.map((application) =>
					application.id === id ? updatedApplication : application,
				),
			);
		} catch (error) {
			console.error("Update status failed:", error);
			setError(
				error instanceof Error
					? error.message
					: "Failed to update application status.",
			);
		}
	}

	const totalApplications = applications.length;
	const activeApplications = applications.filter(
		(application) =>
			application.status !== "rejected" &&
			application.status !== "withdrawn",
	).length;
	const interviewCount = applications.filter(
		(application) => application.status === "interviewing",
	).length;

	return (
		<main className="dashboardPage">
			<header className="dashboardHeader">
				<div>
					<p className="eyebrow">Dashboard</p>
					<h1>Job application tracker</h1>
					<p className="muted">
						Track every saved role, application, interview, and
						offer.
					</p>
				</div>

				<button className="secondaryButton" onClick={logout}>
					Log out
				</button>
			</header>

			{error && <p className="errorText">{error}</p>}

			<section className="statsGrid">
				<article className="statCard">
					<span>Total</span>
					<strong>{totalApplications}</strong>
				</article>

				<article className="statCard">
					<span>Active</span>
					<strong>{activeApplications}</strong>
				</article>

				<article className="statCard">
					<span>Interviewing</span>
					<strong>{interviewCount}</strong>
				</article>
			</section>

			<AddApplicationForm
				onApplicationCreated={handleApplicationCreated}
			/>

			{isLoading ? (
				<p className="muted">Loading applications...</p>
			) : (
				<KanbanBoard
					applications={applications}
					onStatusChange={handleStatusChange}
				/>
			)}
		</main>
	);
}
