import type {
	ApplicationStatus,
	JobApplication,
} from "../../types/application";

type ApplicationCardProps = {
	application: JobApplication;
	onStatusChange: (id: string, status: ApplicationStatus) => void;
};

const statuses: ApplicationStatus[] = [
	"saved",
	"applied",
	"interviewing",
	"offer",
	"rejected",
	"withdrawn",
];

export default function ApplicationCard({
	application,
	onStatusChange,
}: ApplicationCardProps) {
	return (
		<article className="applicationCard">
			<div>
				<h3>{application.role}</h3>
				<p className="companyName">{application.company}</p>
			</div>

			{application.location && (
				<p className="muted">Location: {application.location}</p>
			)}

			{application.salary && (
				<p className="muted">Salary: {application.salary}</p>
			)}

			{application.notes && <p>{application.notes}</p>}

			{application.job_url && (
				<a href={application.job_url} target="_blank" rel="noreferrer">
					View job post
				</a>
			)}

			<label>
				Move to
				<select
					value={application.status}
					onChange={(event) =>
						onStatusChange(
							application.id,
							event.target.value as ApplicationStatus,
						)
					}
				>
					{statuses.map((status) => (
						<option key={status} value={status}>
							{status}
						</option>
					))}
				</select>
			</label>
		</article>
	);
}
