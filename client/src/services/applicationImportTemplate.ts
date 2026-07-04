import type { WorkSheet } from "xlsx";

const templateRows = [
	{
		company: "Northstar Labs",
		role: "Frontend Developer",
		location: "London",
		"job url": "https://example.com/jobs/frontend-developer",
		salary: "GBP 32,000 - GBP 40,000",
		status: "applied",
		priority: "high",
		"employment type": "full_time",
		"work mode": "hybrid",
		source: "LinkedIn",
		"contact name": "Sam Recruiter",
		"contact email": "sam.recruiter@example.com",
		notes: "Tailored CV submitted. Follow up next week.",
		"applied at": "2026-07-01",
		"follow up at": "2026-07-08",
		deadline: "2026-07-15",
		"interview at": "2026-07-10 10:00",
		"rejected at": "",
		"offer deadline": "",
	},
	{
		company: "Brightpath Finance",
		role: "Data Analyst",
		location: "Remote",
		"job url": "https://example.com/jobs/data-analyst",
		salary: "GBP 30,000 - GBP 36,000",
		status: "saved",
		priority: "medium",
		"employment type": "full_time",
		"work mode": "remote",
		source: "Company website",
		"contact name": "",
		"contact email": "",
		notes: "Review requirements before applying.",
		"applied at": "",
		"follow up at": "",
		deadline: "2026-07-22",
		"interview at": "",
		"rejected at": "",
		"offer deadline": "",
	},
];

const instructionsRows = [
	["Column", "Required", "Example", "Notes"],
	["company", "Yes", "Northstar Labs", "Rows without company are skipped."],
	["role", "Yes", "Frontend Developer", "Rows without role are skipped."],
	["status", "No", "saved", "Allowed: wishlist, saved, applied, assessment, interviewing, offer, rejected, withdrawn."],
	["priority", "No", "medium", "Allowed: low, medium, high."],
	["employment type", "No", "full_time", "Allowed: full_time, part_time, internship, placement, contract, temporary, freelance."],
	["work mode", "No", "hybrid", "Allowed: remote, hybrid, onsite."],
	["date fields", "No", "2026-07-01", "Use YYYY-MM-DD where possible."],
	["interview at", "No", "2026-07-10 10:00", "Date and time values are supported."],
];

function setColumnWidths(sheet: WorkSheet, widths: number[]) {
	sheet["!cols"] = widths.map((wch) => ({ wch }));
}

export async function downloadApplicationImportTemplate() {
	const xlsx = await import("xlsx");
	const workbook = xlsx.utils.book_new();
	const applicationsSheet = xlsx.utils.json_to_sheet(templateRows);
	const instructionsSheet = xlsx.utils.aoa_to_sheet(instructionsRows);

	setColumnWidths(applicationsSheet, [
		22, 24, 16, 42, 24, 16, 14, 18, 16, 18, 20, 28, 38, 14, 16, 14, 18, 14,
		18,
	]);
	setColumnWidths(instructionsSheet, [20, 12, 28, 86]);

	xlsx.utils.book_append_sheet(workbook, applicationsSheet, "Applications");
	xlsx.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
	xlsx.writeFile(workbook, "jobmarkr-import-example.xlsx", {
		compression: true,
	});
}
