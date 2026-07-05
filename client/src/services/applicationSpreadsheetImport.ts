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

type SpreadsheetRow = Record<string, unknown>;
type XlsxModule = typeof import("xlsx");

type ImportResult = {
	applications: CreateApplicationInput[];
	skippedRows: number;
};

const headerAliases: Partial<Record<keyof CreateApplicationInput, string[]>> = {
	company: ["company", "organisation", "organization", "employer"],
	role: ["role", "job title", "position", "title"],
	location: ["location", "city"],
	jobUrl: ["job url", "job link", "url", "link", "posting url"],
	salary: ["salary", "salary range", "pay"],
	hoursPerWeek: ["hours per week", "weekly hours", "hours"],
	jobReferenceId: ["job reference id", "reference id", "job ref", "reference"],
	status: ["status", "stage"],
	priority: ["priority"],
	employmentType: ["employment type", "job type", "type"],
	workMode: ["work mode", "work arrangement", "mode"],
	source: ["source", "job board", "platform"],
	contactName: ["contact name", "recruiter", "recruiter name"],
	contactEmail: ["contact email", "recruiter email", "email"],
	notes: ["notes", "note", "comments", "description"],
	appliedAt: ["applied at", "applied date", "date applied"],
	followUpAt: ["follow up at", "follow-up at", "follow up date", "follow-up date"],
	deadlineAt: ["deadline at", "deadline", "application deadline"],
	interviewAt: ["interview at", "interview date", "interview date time"],
	rejectedAt: ["rejected at", "rejected date"],
	offerDeadlineAt: ["offer deadline at", "offer deadline"],
};

function normalizeHeader(value: string) {
	return value
		.trim()
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[_-]+/g, " ")
		.replace(/\s+/g, " ")
		.toLowerCase();
}

function normalizeOption(value: string) {
	return normalizeHeader(value).replace(/\s+/g, "_");
}

function findCellValue(row: SpreadsheetRow, field: keyof CreateApplicationInput) {
	const aliases = headerAliases[field]?.map(normalizeHeader) ?? [];

	for (const [header, value] of Object.entries(row)) {
		if (aliases.includes(normalizeHeader(header))) {
			return value;
		}
	}

	return undefined;
}

function stringifyCell(value: unknown) {
	if (value == null) return "";

	if (value instanceof Date) {
		return value.toISOString();
	}

	return String(value).trim();
}

function stringField(row: SpreadsheetRow, field: keyof CreateApplicationInput) {
	const value = stringifyCell(findCellValue(row, field));
	return value || undefined;
}

function dateField(
	row: SpreadsheetRow,
	field: keyof CreateApplicationInput,
	xlsx: XlsxModule,
) {
	const value = findCellValue(row, field);

	if (value == null || value === "") return undefined;

	if (value instanceof Date) {
		return value.toISOString().slice(0, 10);
	}

	if (typeof value === "number") {
		const date = xlsx.SSF.parse_date_code(value);

		if (!date) return undefined;

		return [
			String(date.y).padStart(4, "0"),
			String(date.m).padStart(2, "0"),
			String(date.d).padStart(2, "0"),
		].join("-");
	}

	const text = stringifyCell(value);

	if (!text) return undefined;

	const parsed = new Date(text);

	if (!Number.isNaN(parsed.getTime())) {
		return parsed.toISOString().slice(0, 10);
	}

	return text;
}

function dateTimeField(
	row: SpreadsheetRow,
	field: keyof CreateApplicationInput,
	xlsx: XlsxModule,
) {
	const value = findCellValue(row, field);

	if (value instanceof Date) {
		return value.toISOString();
	}

	if (typeof value === "number") {
		const date = xlsx.SSF.parse_date_code(value);

		if (!date) return undefined;

		return new Date(
			date.y,
			date.m - 1,
			date.d,
			date.H,
			date.M,
			Math.floor(date.S),
		).toISOString();
	}

	return dateField(row, field, xlsx);
}

function enumField<T extends string>(
	row: SpreadsheetRow,
	field: keyof CreateApplicationInput,
	options: readonly T[],
) {
	const value = stringField(row, field);

	if (!value) return undefined;

	const normalized = normalizeOption(value);

	return options.find((option) => option === normalized);
}

function mapRowToApplication(
	row: SpreadsheetRow,
	xlsx: XlsxModule,
): CreateApplicationInput | null {
	const company = stringField(row, "company");
	const role = stringField(row, "role");

	if (!company || !role) return null;

	return {
		company,
		role,
		location: stringField(row, "location"),
		jobUrl: stringField(row, "jobUrl"),
		salary: stringField(row, "salary"),
		hoursPerWeek: stringField(row, "hoursPerWeek"),
		jobReferenceId: stringField(row, "jobReferenceId"),
		status:
			enumField<ApplicationStatus>(row, "status", APPLICATION_STATUSES) ??
			"saved",
		priority:
			enumField<ApplicationPriority>(
				row,
				"priority",
				APPLICATION_PRIORITIES,
			) ?? "medium",
		employmentType:
			enumField<EmploymentType>(row, "employmentType", EMPLOYMENT_TYPES) ??
			"",
		workMode: enumField<WorkMode>(row, "workMode", WORK_MODES) ?? "",
		source: stringField(row, "source"),
		contactName: stringField(row, "contactName"),
		contactEmail: stringField(row, "contactEmail"),
		notes: stringField(row, "notes"),
		appliedAt: dateField(row, "appliedAt", xlsx),
		followUpAt: dateField(row, "followUpAt", xlsx),
		deadlineAt: dateField(row, "deadlineAt", xlsx),
		interviewAt: dateTimeField(row, "interviewAt", xlsx),
		rejectedAt: dateField(row, "rejectedAt", xlsx),
		offerDeadlineAt: dateField(row, "offerDeadlineAt", xlsx),
	};
}

export async function parseApplicationsSpreadsheet(file: File): Promise<ImportResult> {
	const xlsx = await import("xlsx");
	const data = await file.arrayBuffer();
	const workbook = xlsx.read(data, { cellDates: true });
	const firstSheetName = workbook.SheetNames[0];

	if (!firstSheetName) {
		return { applications: [], skippedRows: 0 };
	}

	const rows = xlsx.utils.sheet_to_json<SpreadsheetRow>(
		workbook.Sheets[firstSheetName],
		{ defval: "" },
	);
	const applications = rows
		.map((row) => mapRowToApplication(row, xlsx))
		.filter((application): application is CreateApplicationInput =>
			Boolean(application),
		);

	return {
		applications,
		skippedRows: rows.length - applications.length,
	};
}
