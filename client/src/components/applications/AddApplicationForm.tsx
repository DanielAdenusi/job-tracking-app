import { useState } from "react";
import { createApplication } from "../../features/applications/applicationService";
import type {
	ApplicationStatus,
	JobApplication,
} from "../../types/application";

type AddApplicationFormProps = {
	onApplicationCreated: (application: JobApplication) => void;
};

const statuses: ApplicationStatus[] = [
	"saved",
	"applied",
	"interviewing",
	"offer",
	"rejected",
	"withdrawn",
];

export default function AddApplicationForm({
	onApplicationCreated,
}: AddApplicationFormProps) {
	const [company, setCompany] = useState("");
	const [role, setRole] = useState("");
	const [location, setLocation] = useState("");
	const [jobUrl, setJobUrl] = useState("");
	const [salary, setSalary] = useState("");
	const [status, setStatus] = useState<ApplicationStatus>("saved");
	const [notes, setNotes] = useState("");
	const [appliedAt, setAppliedAt] = useState("");
	const [followUpAt, setFollowUpAt] = useState("");

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");

		if (!company.trim() || !role.trim()) {
			setError("Company and role are required.");
			return;
		}

		try {
			setIsSubmitting(true);

			const newApplication = await createApplication({
				company,
				role,
				location,
				jobUrl,
				salary,
				status,
				notes,
				appliedAt,
				followUpAt,
			});

			onApplicationCreated(newApplication);

			setCompany("");
			setRole("");
			setLocation("");
			setJobUrl("");
			setSalary("");
			setStatus("saved");
			setNotes("");
			setAppliedAt("");
			setFollowUpAt("");
		} catch (error) {
			console.error("Create application failed:", error);
			setError(
				error instanceof Error
					? error.message
					: "Failed to create application.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form className="formCard" onSubmit={handleSubmit}>
			<div>
				<h2>Add application</h2>
				<p className="muted">Save a role you want to track.</p>
			</div>

			{error && <p className="errorText">{error}</p>}

			<div className="formGrid">
				<label>
					Company
					<input
						value={company}
						onChange={(event) => setCompany(event.target.value)}
						placeholder="Google"
					/>
				</label>

				<label>
					Role
					<input
						value={role}
						onChange={(event) => setRole(event.target.value)}
						placeholder="Frontend Developer"
					/>
				</label>

				<label>
					Location
					<input
						value={location}
						onChange={(event) => setLocation(event.target.value)}
						placeholder="London / Remote"
					/>
				</label>

				<label>
					Job URL
					<input
						value={jobUrl}
						onChange={(event) => setJobUrl(event.target.value)}
						placeholder="https://..."
					/>
				</label>

				<label>
					Salary
					<input
						value={salary}
						onChange={(event) => setSalary(event.target.value)}
						placeholder="£35,000"
					/>
				</label>

				<label>
					Status
					<select
						value={status}
						onChange={(event) =>
							setStatus(event.target.value as ApplicationStatus)
						}
					>
						{statuses.map((status) => (
							<option key={status} value={status}>
								{status}
							</option>
						))}
					</select>
				</label>

				<label>
					Applied date
					<input
						type="date"
						value={appliedAt}
						onChange={(event) => setAppliedAt(event.target.value)}
					/>
				</label>

				<label>
					Follow-up date
					<input
						type="date"
						value={followUpAt}
						onChange={(event) => setFollowUpAt(event.target.value)}
					/>
				</label>
			</div>

			<label>
				Notes
				<textarea
					value={notes}
					onChange={(event) => setNotes(event.target.value)}
					placeholder="Recruiter name, interview notes, CV version used..."
				/>
			</label>

			<button className="primaryButton" disabled={isSubmitting}>
				{isSubmitting ? "Adding..." : "Add application"}
			</button>
		</form>
	);
}
