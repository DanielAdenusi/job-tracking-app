import { pool } from "../db/pool.js";

function mapRecentApplication(row) {
	return {
		id: row.id,
		company: row.company,
		role: row.role,
		status: row.status,
		priority: row.priority,
		location: row.location,
		followUpAt: row.follow_up_at,
		createdAt: row.created_at,
	};
}

function mapReminderDigest(row) {
	return {
		...mapRecentApplication(row),
		eventKind: row.event_kind,
		eventAt: row.event_at,
	};
}

export async function getDashboardStats(userId) {
	const statsResult = await pool.query(
		`
    SELECT
      COUNT(*)::int AS total_applications,

      COUNT(*) FILTER (
        WHERE status = 'applied'
      )::int AS applied_count,

      COUNT(*) FILTER (
        WHERE status IN ('assessment', 'interviewing')
      )::int AS interview_count,

      COUNT(*) FILTER (
        WHERE status = 'offer'
      )::int AS offer_count,

      COUNT(*) FILTER (
        WHERE status = 'rejected'
      )::int AS rejected_count,

      COUNT(*) FILTER (
        WHERE follow_up_at IS NOT NULL
        AND follow_up_at >= CURRENT_DATE
      )::int AS upcoming_follow_up_count,

      COUNT(*) FILTER (
        WHERE follow_up_at IS NOT NULL
        AND follow_up_at < CURRENT_DATE
        AND status NOT IN ('rejected', 'withdrawn', 'offer')
      )::int AS overdue_follow_up_count
    FROM applications
    WHERE user_id = $1
    `,
		[userId],
	);

	const recentResult = await pool.query(
		`
    SELECT
      id,
      company,
      role,
      status,
      priority,
      location,
      follow_up_at,
      created_at
    FROM applications
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 3
    `,
		[userId],
	);

	const upcomingFollowUpsResult = await pool.query(
		`
    SELECT
      id,
      company,
      role,
      status,
      priority,
      location,
      follow_up_at,
      created_at
    FROM applications
    WHERE user_id = $1
    AND follow_up_at IS NOT NULL
    AND follow_up_at >= CURRENT_DATE
    AND status NOT IN ('rejected', 'withdrawn')
    ORDER BY follow_up_at ASC
    LIMIT 3
    `,
		[userId],
	);

	const reminderDigestResult = await pool.query(
		`
    SELECT
      applications.id,
      applications.company,
      applications.role,
      applications.status,
      applications.priority,
      applications.location,
      applications.follow_up_at,
      applications.created_at,
      event_data.event_kind,
      event_data.event_at
    FROM applications
    CROSS JOIN LATERAL (
      VALUES
        (
          'follow_up',
          CASE
            WHEN applications.follow_up_at IS NULL THEN NULL
            ELSE (applications.follow_up_at::timestamp + TIME '09:00')::timestamptz
          END
        ),
        (
          'deadline',
          CASE
            WHEN applications.deadline_at IS NULL THEN NULL
            ELSE (applications.deadline_at::timestamp + TIME '09:00')::timestamptz
          END
        ),
        ('interview', applications.interview_at),
        (
          'offer_deadline',
          CASE
            WHEN applications.offer_deadline_at IS NULL THEN NULL
            ELSE (applications.offer_deadline_at::timestamp + TIME '09:00')::timestamptz
          END
        )
    ) AS event_data(event_kind, event_at)
    WHERE applications.user_id = $1
    AND event_data.event_at IS NOT NULL
    AND event_data.event_at >= NOW()
    AND applications.status NOT IN ('rejected', 'withdrawn')
    ORDER BY event_data.event_at ASC
    LIMIT 5
    `,
		[userId],
	);

	const stats = statsResult.rows[0];

	return {
		totalApplications: stats.total_applications,
		appliedCount: stats.applied_count,
		interviewCount: stats.interview_count,
		offerCount: stats.offer_count,
		rejectedCount: stats.rejected_count,
		upcomingFollowUpCount: stats.upcoming_follow_up_count,
		overdueFollowUpCount: stats.overdue_follow_up_count,
		recentApplications: recentResult.rows.map(mapRecentApplication),
		upcomingFollowUps:
			upcomingFollowUpsResult.rows.map(mapRecentApplication),
		reminderDigest: reminderDigestResult.rows.map(mapReminderDigest),
	};
}
