import { auth } from "../lib/firebase";
import type {
	Application,
	CreateApplicationInput,
	UpdateApplicationInput,
} from "../types/application";

const storageKeyPrefix = "jobmarkr:applications";

type PendingCreate = {
	localId: string;
	data: CreateApplicationInput;
	createdAt: string;
	updatedAt: string;
};

type ApplicationsSnapshot = {
	version: 1;
	updatedAt: string;
	applications: Application[];
	pendingCreates: PendingCreate[];
};

function getStorageKey() {
	return `${storageKeyPrefix}:${auth.currentUser?.uid || "anonymous"}`;
}

function createEmptySnapshot(): ApplicationsSnapshot {
	return {
		version: 1,
		updatedAt: new Date().toISOString(),
		applications: [],
		pendingCreates: [],
	};
}

function readSnapshot(): ApplicationsSnapshot {
	if (typeof window === "undefined") {
		return createEmptySnapshot();
	}

	try {
		const storedValue = window.localStorage.getItem(getStorageKey());

		if (!storedValue) {
			return createEmptySnapshot();
		}

		const parsed = JSON.parse(storedValue) as Partial<ApplicationsSnapshot>;

		if (!Array.isArray(parsed.applications)) {
			return createEmptySnapshot();
		}

		return {
			version: 1,
			updatedAt:
				typeof parsed.updatedAt === "string"
					? parsed.updatedAt
					: new Date().toISOString(),
			applications: parsed.applications,
			pendingCreates: Array.isArray(parsed.pendingCreates)
				? parsed.pendingCreates
				: [],
		};
	} catch {
		return createEmptySnapshot();
	}
}

function writeSnapshot(snapshot: ApplicationsSnapshot) {
	if (typeof window === "undefined") return;

	try {
		window.localStorage.setItem(
			getStorageKey(),
			JSON.stringify({
				...snapshot,
				updatedAt: new Date().toISOString(),
			}),
		);
	} catch {
		// Storage can fail in private windows or when quota is exceeded.
	}
}

function nullableText(value: string | undefined) {
	const trimmedValue = value?.trim();

	return trimmedValue ? trimmedValue : null;
}

function optionalDate(value: string | undefined) {
	return value || null;
}

function normalizeJobDescription(
	value: CreateApplicationInput["jobDescription"] | Application["jobDescription"] | undefined,
) {
	const normalizeItems = (items: unknown) =>
		(Array.isArray(items) ? items : [])
			.map((item) => String(item).trim())
			.filter(Boolean);

	return {
		role: normalizeItems(value?.role),
		keyResponsibilities: normalizeItems(value?.keyResponsibilities),
		lookingFor: normalizeItems(value?.lookingFor),
		desirable: normalizeItems(value?.desirable),
		whyJoinUs: normalizeItems(value?.whyJoinUs),
	};
}

function createLocalId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return `local-${crypto.randomUUID()}`;
	}

	return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildLocalApplication(
	data: CreateApplicationInput,
	localId = createLocalId(),
	createdAt = new Date().toISOString(),
): Application {
	const status = data.status || "saved";

	return {
		id: localId,
		userId: auth.currentUser?.uid || "local",
		company: data.company,
		role: data.role,
		location: nullableText(data.location),
		jobUrl: nullableText(data.jobUrl),
		salary: nullableText(data.salary),
		hoursPerWeek: nullableText(data.hoursPerWeek),
		jobReferenceId: nullableText(data.jobReferenceId),
		jobDescription: normalizeJobDescription(data.jobDescription),
		status,
		priority: data.priority || "medium",
		employmentType: data.employmentType || null,
		workMode: data.workMode || null,
		source: nullableText(data.source),
		contactName: nullableText(data.contactName),
		contactEmail: nullableText(data.contactEmail),
		notes: nullableText(data.notes),
		appliedAt: optionalDate(data.appliedAt),
		followUpAt: optionalDate(data.followUpAt),
		deadlineAt: optionalDate(data.deadlineAt),
		interviewAt: optionalDate(data.interviewAt),
		rejectedAt: optionalDate(data.rejectedAt),
		offerDeadlineAt: optionalDate(data.offerDeadlineAt),
		statusTransitions: [
			{
				status,
				transitionedAt: createdAt,
			},
		],
		createdAt,
		updatedAt: createdAt,
	};
}

function sortApplications(applications: Application[]) {
	return [...applications].sort(
		(a, b) =>
			new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
}

function hasMatchingRemoteApplication(
	pendingCreate: PendingCreate,
	applications: Application[],
) {
	const pending = buildLocalApplication(
		pendingCreate.data,
		pendingCreate.localId,
		pendingCreate.createdAt,
	);

	return applications.some(
		(application) =>
			application.company.trim().toLowerCase() ===
				pending.company.trim().toLowerCase() &&
			application.role.trim().toLowerCase() ===
				pending.role.trim().toLowerCase() &&
			(application.jobUrl || "") === (pending.jobUrl || "") &&
			(application.appliedAt || "") === (pending.appliedAt || ""),
	);
}

function mergeApplications(applications: Application[]) {
	const byId = new Map<string, Application>();

	for (const application of applications) {
		byId.set(application.id, application);
	}

	return sortApplications(Array.from(byId.values()));
}

export function isLocalApplicationId(id: string) {
	return id.startsWith("local-");
}

export function getPendingCreateCount() {
	return readSnapshot().pendingCreates.length;
}

export function getCachedApplications() {
	return readSnapshot().applications;
}

export function getCachedApplication(id: string) {
	return readSnapshot().applications.find(
		(application) => application.id === id,
	);
}

export function saveApplicationsSnapshot(applications: Application[]) {
	const snapshot = readSnapshot();
	const pendingApplications = snapshot.pendingCreates.map((pendingCreate) =>
		buildLocalApplication(
			pendingCreate.data,
			pendingCreate.localId,
			pendingCreate.createdAt,
		),
	);

	const nextSnapshot = {
		...snapshot,
		applications: mergeApplications([...applications, ...pendingApplications]),
	};

	writeSnapshot(nextSnapshot);

	return nextSnapshot.applications;
}

export function upsertCachedApplication(application: Application) {
	const snapshot = readSnapshot();
	const applications = mergeApplications([
		application,
		...snapshot.applications.filter((item) => item.id !== application.id),
	]);

	writeSnapshot({
		...snapshot,
		applications,
	});
}

export function createCachedApplication(data: CreateApplicationInput) {
	const snapshot = readSnapshot();
	const createdAt = new Date().toISOString();
	const localId = createLocalId();
	const application = buildLocalApplication(data, localId, createdAt);

	writeSnapshot({
		...snapshot,
		applications: mergeApplications([application, ...snapshot.applications]),
		pendingCreates: [
			...snapshot.pendingCreates,
			{
				localId,
				data,
				createdAt,
				updatedAt: createdAt,
			},
		],
	});

	return application;
}

export function updateCachedApplication(
	id: string,
	data: UpdateApplicationInput,
) {
	const snapshot = readSnapshot();
	const existing = snapshot.applications.find(
		(application) => application.id === id,
	);

	if (!existing) return null;

	const updatedAt = new Date().toISOString();
	const updatedApplication: Application = {
		...existing,
		...data,
		location:
			data.location === undefined
				? existing.location
				: nullableText(data.location),
		jobUrl:
			data.jobUrl === undefined ? existing.jobUrl : nullableText(data.jobUrl),
		salary:
			data.salary === undefined ? existing.salary : nullableText(data.salary),
		hoursPerWeek:
			data.hoursPerWeek === undefined
				? existing.hoursPerWeek
				: nullableText(data.hoursPerWeek),
		jobReferenceId:
			data.jobReferenceId === undefined
				? existing.jobReferenceId
				: nullableText(data.jobReferenceId),
		jobDescription:
			data.jobDescription === undefined
				? normalizeJobDescription(existing.jobDescription)
				: normalizeJobDescription(data.jobDescription),
		employmentType:
			data.employmentType === undefined
				? existing.employmentType
				: data.employmentType || null,
		workMode:
			data.workMode === undefined
				? existing.workMode
				: data.workMode || null,
		source:
			data.source === undefined ? existing.source : nullableText(data.source),
		contactName:
			data.contactName === undefined
				? existing.contactName
				: nullableText(data.contactName),
		contactEmail:
			data.contactEmail === undefined
				? existing.contactEmail
				: nullableText(data.contactEmail),
		notes: data.notes === undefined ? existing.notes : nullableText(data.notes),
		appliedAt:
			data.appliedAt === undefined
				? existing.appliedAt
				: optionalDate(data.appliedAt),
		followUpAt:
			data.followUpAt === undefined
				? existing.followUpAt
				: optionalDate(data.followUpAt),
		deadlineAt:
			data.deadlineAt === undefined
				? existing.deadlineAt
				: optionalDate(data.deadlineAt),
		interviewAt:
			data.interviewAt === undefined
				? existing.interviewAt
				: optionalDate(data.interviewAt),
		rejectedAt:
			data.rejectedAt === undefined
				? existing.rejectedAt
				: optionalDate(data.rejectedAt),
		offerDeadlineAt:
			data.offerDeadlineAt === undefined
				? existing.offerDeadlineAt
				: optionalDate(data.offerDeadlineAt),
		updatedAt,
	};

	const pendingCreates = snapshot.pendingCreates.map((pendingCreate) =>
		pendingCreate.localId === id
			? {
					...pendingCreate,
					data: {
						...pendingCreate.data,
						...data,
					},
					updatedAt,
				}
			: pendingCreate,
	);

	writeSnapshot({
		...snapshot,
		applications: mergeApplications([
			updatedApplication,
			...snapshot.applications.filter((item) => item.id !== id),
		]),
		pendingCreates,
	});

	return updatedApplication;
}

export function updateCachedApplicationStatus(
	id: string,
	status: Application["status"],
) {
	const existing = getCachedApplication(id);

	if (!existing) return null;

	return updateCachedApplication(id, {
		status,
	});
}

export function deleteCachedApplication(id: string) {
	const snapshot = readSnapshot();

	writeSnapshot({
		...snapshot,
		applications: snapshot.applications.filter(
			(application) => application.id !== id,
		),
		pendingCreates: snapshot.pendingCreates.filter(
			(pendingCreate) => pendingCreate.localId !== id,
		),
	});
}

export function clearCachedApplications() {
	writeSnapshot(createEmptySnapshot());
}

export async function syncPendingCreates(
	remoteApplications: Application[],
	createRemoteApplication: (
		data: CreateApplicationInput,
	) => Promise<Application>,
) {
	const snapshot = readSnapshot();
	const syncedApplications = [...remoteApplications];
	const unsyncedCreates: PendingCreate[] = [];

	for (const pendingCreate of snapshot.pendingCreates) {
		if (hasMatchingRemoteApplication(pendingCreate, syncedApplications)) {
			continue;
		}

		try {
			const createdApplication = await createRemoteApplication(
				pendingCreate.data,
			);
			syncedApplications.unshift(createdApplication);
		} catch {
			unsyncedCreates.push(pendingCreate);
		}
	}

	const pendingApplications = unsyncedCreates.map((pendingCreate) =>
		buildLocalApplication(
			pendingCreate.data,
			pendingCreate.localId,
			pendingCreate.createdAt,
		),
	);
	const applications = mergeApplications([
		...syncedApplications,
		...pendingApplications,
	]);

	writeSnapshot({
		...snapshot,
		applications,
		pendingCreates: unsyncedCreates,
	});

	return applications;
}
