import { pool } from "../db/pool.js";
import { APPLICATION_STATUSES } from "../constants/applicationOptions.js";

function emptyToNull(value) {
	return value === "" ? null : value;
}

function getNextOptionalValue(dataValue, existingValue) {
	if (dataValue === undefined) {
		return existingValue;
	}

	return emptyToNull(dataValue);
}

function normalizeJobDescription(value) {
	const description =
		value && typeof value === "object" && !Array.isArray(value) ? value : {};
	const normalizeItems = (items) =>
		(Array.isArray(items) ? items : [])
			.map((item) => String(item).trim())
			.filter(Boolean);

	return {
		role: normalizeItems(description.role),
		keyResponsibilities: normalizeItems(description.keyResponsibilities),
		lookingFor: normalizeItems(description.lookingFor),
		desirable: normalizeItems(description.desirable),
		whyJoinUs: normalizeItems(description.whyJoinUs),
	};
}

function formatTransitionTimestamp(value) {
	if (!value) {
		return new Date().toISOString();
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	return value;
}

function normalizeStatusTransitions(value, fallbackStatus, fallbackDate) {
	const transitions = Array.isArray(value) ? value : [];

	const normalizedTransitions = transitions
		.filter(
			(transition) =>
				transition &&
				APPLICATION_STATUSES.includes(transition.status) &&
				transition.transitionedAt,
		)
		.map((transition) => ({
			status: transition.status,
			transitionedAt: formatTransitionTimestamp(
				transition.transitionedAt,
			),
		}));

	if (normalizedTransitions.length > 0) {
		return normalizedTransitions;
	}

	return [
		{
			status: fallbackStatus,
			transitionedAt: formatTransitionTimestamp(fallbackDate),
		},
	];
}

function getNextStatusTransitions(existing, nextStatus) {
	const existingTransitions = normalizeStatusTransitions(
		existing.statusTransitions,
		existing.status,
		existing.createdAt,
	);

	if (nextStatus === existing.status) {
		return existingTransitions;
	}

	const transition = {
		status: nextStatus,
		transitionedAt: new Date().toISOString(),
	};

	if (nextStatus === "wishlist") {
		return [transition];
	}

	return [...existingTransitions, transition];
}

function mapApplicationRow(row) {
	return {
		id: row.id,
		userId: row.user_id,
		company: row.company,
		role: row.role,
		location: row.location,
		jobUrl: row.job_url,
		salary: row.salary,
		hoursPerWeek: row.hours_per_week,
		jobReferenceId: row.job_reference_id,
		jobDescription: normalizeJobDescription(row.job_description),
		status: row.status,
		priority: row.priority,
		employmentType: row.employment_type,
		workMode: row.work_mode,
		source: row.source,
		contactName: row.contact_name,
		contactEmail: row.contact_email,
		notes: row.notes,
		appliedAt: row.applied_at,
		followUpAt: row.follow_up_at,
		deadlineAt: row.deadline_at,
		interviewAt: row.interview_at,
		rejectedAt: row.rejected_at,
		offerDeadlineAt: row.offer_deadline_at,
		statusTransitions: normalizeStatusTransitions(
			row.status_transitions,
			row.status,
			row.created_at,
		),
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export async function getApplicationsByUser(userId) {
	const result = await pool.query(
		`
    SELECT *
    FROM applications
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
		[userId],
	);

	return result.rows.map(mapApplicationRow);
}

export async function getApplicationById(userId, applicationId) {
	const result = await pool.query(
		`
    SELECT *
    FROM applications
    WHERE user_id = $1
    AND id = $2
    `,
		[userId, applicationId],
	);

	if (result.rows.length === 0) {
		return null;
	}

	return mapApplicationRow(result.rows[0]);
}

export async function getApplicationsByStatus(userId, status) {
	const result = await pool.query(
		`
        SELECT *
        FROM applications
        WHERE user_id = $1
        AND status = $2
        ORDER BY created_at DESC
        `,
		[userId, status],
	);

	return result.rows.map(mapApplicationRow);
}

export async function createApplication(userId, data) {
	const result = await pool.query(
		`
    INSERT INTO applications (
      user_id,
      company,
      role,
      location,
      job_url,
      salary,
      hours_per_week,
      job_reference_id,
      job_description,
      status,
      priority,
      employment_type,
      work_mode,
      source,
      contact_name,
      contact_email,
      notes,
      applied_at,
      follow_up_at,
      deadline_at,
      interview_at,
      rejected_at,
      offer_deadline_at,
      status_transitions
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, COALESCE($9::jsonb, '{}'::jsonb), COALESCE($10, 'saved'),
      COALESCE($11, 'medium'), $12, $13, $14,
      $15, $16, $17, $18, $19,
      $20, $21, $22, $23,
      jsonb_build_array(
        jsonb_build_object(
          'status', COALESCE($10, 'saved'),
          'transitionedAt', NOW()
        )
      )
    )
    RETURNING *
    `,
		[
			userId,
			data.company,
			data.role,
			data.location || null,
			data.jobUrl || null,
			data.salary || null,
			data.hoursPerWeek || null,
			data.jobReferenceId || null,
			JSON.stringify(normalizeJobDescription(data.jobDescription)),
			data.status || "saved",
			data.priority || "medium",
			data.employmentType || null,
			data.workMode || null,
			data.source || null,
			data.contactName || null,
			data.contactEmail || null,
			data.notes || null,
			data.appliedAt || null,
			data.followUpAt || null,
			data.deadlineAt || null,
			data.interviewAt || null,
			data.rejectedAt || null,
			data.offerDeadlineAt || null,
		],
	);

	return mapApplicationRow(result.rows[0]);
}

export async function updateApplication(userId, applicationId, data) {
	const existing = await getApplicationById(userId, applicationId);

	if (!existing) {
		return null;
	}

	const nextStatus = data.status ?? existing.status;
	const nextStatusTransitions = getNextStatusTransitions(
		existing,
		nextStatus,
	);

	const result = await pool.query(
		`
    UPDATE applications
    SET
      company = COALESCE($3, company),
      role = COALESCE($4, role),
      location = $5,
      job_url = $6,
      salary = $7,
      hours_per_week = $8,
      job_reference_id = $9,
      job_description = $10::jsonb,
      status = COALESCE($11, status),
      priority = COALESCE($12, priority),
      employment_type = $13,
      work_mode = $14,
      source = $15,
      contact_name = $16,
      contact_email = $17,
      notes = $18,
      applied_at = $19,
      follow_up_at = $20,
      deadline_at = $21,
      interview_at = $22,
      rejected_at = $23,
      offer_deadline_at = $24,
      status_transitions = $25::jsonb
    WHERE user_id = $1
    AND id = $2
    RETURNING *
    `,
		[
			userId,
			applicationId,
			data.company ?? existing.company,
			data.role ?? existing.role,
			getNextOptionalValue(data.location, existing.location),
			getNextOptionalValue(data.jobUrl, existing.jobUrl),
			getNextOptionalValue(data.salary, existing.salary),
			getNextOptionalValue(data.hoursPerWeek, existing.hoursPerWeek),
			getNextOptionalValue(data.jobReferenceId, existing.jobReferenceId),
			JSON.stringify(
				data.jobDescription === undefined
					? existing.jobDescription
					: normalizeJobDescription(data.jobDescription),
			),
			data.status ?? existing.status,
			data.priority ?? existing.priority,
			getNextOptionalValue(data.employmentType, existing.employmentType),
			getNextOptionalValue(data.workMode, existing.workMode),
			getNextOptionalValue(data.source, existing.source),
			getNextOptionalValue(data.contactName, existing.contactName),
			getNextOptionalValue(data.contactEmail, existing.contactEmail),
			getNextOptionalValue(data.notes, existing.notes),
			getNextOptionalValue(data.appliedAt, existing.appliedAt),
			getNextOptionalValue(data.followUpAt, existing.followUpAt),
			getNextOptionalValue(data.deadlineAt, existing.deadlineAt),
			getNextOptionalValue(data.interviewAt, existing.interviewAt),
			getNextOptionalValue(data.rejectedAt, existing.rejectedAt),
			getNextOptionalValue(
				data.offerDeadlineAt,
				existing.offerDeadlineAt,
			),
			JSON.stringify(nextStatusTransitions),
		],
	);

	return mapApplicationRow(result.rows[0]);
}

export async function updateApplicationStatus(userId, applicationId, status) {
	const existing = await getApplicationById(userId, applicationId);

	if (!existing) {
		return null;
	}

	if (existing.status === status) {
		return existing;
	}

	const nextStatusTransitions = getNextStatusTransitions(existing, status);

	const result = await pool.query(
		`
    UPDATE applications
    SET status = $3,
        status_transitions = $4::jsonb
    WHERE user_id = $1
    AND id = $2
    RETURNING *
    `,
		[userId, applicationId, status, JSON.stringify(nextStatusTransitions)],
	);

	if (result.rows.length === 0) {
		return null;
	}

	return mapApplicationRow(result.rows[0]);
}

export async function deleteApplication(userId, applicationId) {
	const result = await pool.query(
		`
    DELETE FROM applications
    WHERE user_id = $1
    AND id = $2
    RETURNING id
    `,
		[userId, applicationId],
	);

	return result.rows.length > 0;
}

export async function deleteApplicationsByUser(userId) {
	const result = await pool.query(
		`
    DELETE FROM applications
    WHERE user_id = $1
    RETURNING id
    `,
		[userId],
	);

	return result.rowCount;
}
