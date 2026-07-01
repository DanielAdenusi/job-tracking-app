import type {
	ApplicationStatus,
	JobApplication,
} from "../../types/application";
import ApplicationCard from "./ApplicationCard";

type KanbanBoardProps = {
	applications: JobApplication[];
	onStatusChange: (id: string, status: ApplicationStatus) => void;
};

const columns: { label: string; status: ApplicationStatus }[] = [
	{ label: "Saved", status: "saved" },
	{ label: "Applied", status: "applied" },
	{ label: "Interviewing", status: "interviewing" },
	{ label: "Offer", status: "offer" },
	{ label: "Rejected", status: "rejected" },
	{ label: "Withdrawn", status: "withdrawn" },
];

export default function KanbanBoard({
	applications,
	onStatusChange,
}: KanbanBoardProps) {
	return (
		<section className="kanbanSection">
			<div className="sectionHeader">
				<div>
					<h2>Pipeline</h2>
					<p className="muted">
						Move applications through your job search.
					</p>
				</div>
			</div>

			<div className="kanbanBoard">
				{columns.map((column) => {
					const columnApplications = applications.filter(
						(application) => application.status === column.status,
					);

					return (
						<section className="kanbanColumn" key={column.status}>
							<div className="columnHeader">
								<h3>{column.label}</h3>
								<span>{columnApplications.length}</span>
							</div>

							<div className="columnCards">
								{columnApplications.length > 0 ? (
									columnApplications.map((application) => (
										<ApplicationCard
											key={application.id}
											application={application}
											onStatusChange={onStatusChange}
										/>
									))
								) : (
									<p className="emptyColumn">
										No applications yet.
									</p>
								)}
							</div>
						</section>
					);
				})}
			</div>
		</section>
	);
}
