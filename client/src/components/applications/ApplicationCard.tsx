import type { Application } from "../../types/application";
import type { ApplicationStatus } from "../../constants/applicationOptions";

type ApplicationCardProps = {
	application: Application;
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

			{application.jobUrl && (
				<a href={application.jobUrl} target="_blank" rel="noreferrer">
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
