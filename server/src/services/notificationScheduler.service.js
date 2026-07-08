import { pool } from "../db/pool.js";
import { sendPushNotification } from "./pushSubscriptions.service.js";

const reminderWindowMinutes = 5;

function formatEventTime(value) {
	return new Intl.DateTimeFormat("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "Europe/London",
	}).format(new Date(value));
}

function buildNotificationPayload(row) {
	const eventLabels = {
		follow_up: "Follow-up",
		deadline: "Application deadline",
		interview: "Interview",
		offer_deadline: "Offer deadline",
	};
	const label = eventLabels[row.event_kind] || "Reminder";
	const title = `${label}: ${row.role} at ${row.company}`;
	const leadText =
		row.reminder_lead_minutes === 0
			? "now"
			: row.reminder_lead_minutes < 60
				? `in ${row.reminder_lead_minutes} minutes`
				: row.reminder_lead_minutes < 60 * 24
					? `in ${Math.round(row.reminder_lead_minutes / 60)} hours`
					: `in ${Math.round(row.reminder_lead_minutes / (60 * 24))} days`;

	return {
		title,
		body: `${label} is due ${leadText} (${formatEventTime(row.event_at)}).`,
		url: `/applications/${row.application_id}`,
		tag: `${row.application_id}:${row.event_kind}:${row.reminder_lead_minutes}:${row.event_at}`,
		badge: "/favicon/favicon-bg-192.png",
		icon: "/favicon/favicon-bg-192.png",
		data: {
			applicationId: row.application_id,
			eventKind: row.event_kind,
			eventAt: row.event_at,
		},
	};
}

async function getDueNotifications() {
	const result = await pool.query(
		`
    WITH application_events AS (
      SELECT
        applications.user_id,
        applications.id AS application_id,
        applications.company,
        applications.role,
        event_data.event_kind,
        event_data.event_at,
        event_data.reminder_lead_minutes
      FROM applications
      CROSS JOIN LATERAL (
        VALUES
          (
            'follow_up',
            CASE
              WHEN applications.follow_up_at IS NULL THEN NULL
              ELSE (applications.follow_up_at::timestamp + TIME '09:00')::timestamptz
            END,
            applications.reminder_lead_minutes
          ),
          (
            'deadline',
            CASE
              WHEN applications.deadline_at IS NULL THEN NULL
              ELSE (applications.deadline_at::timestamp + TIME '09:00')::timestamptz
            END,
            applications.reminder_lead_minutes
          ),
          (
            'interview',
            applications.interview_at,
            applications.reminder_lead_minutes
          ),
          (
            'offer_deadline',
            CASE
              WHEN applications.offer_deadline_at IS NULL THEN NULL
              ELSE (applications.offer_deadline_at::timestamp + TIME '09:00')::timestamptz
            END,
            applications.reminder_lead_minutes
          ),
          (
            'follow_up',
            CASE
              WHEN applications.follow_up_at IS NULL THEN NULL
              ELSE (applications.follow_up_at::timestamp + TIME '09:00')::timestamptz
            END,
            applications.second_reminder_lead_minutes
          ),
          (
            'deadline',
            CASE
              WHEN applications.deadline_at IS NULL THEN NULL
              ELSE (applications.deadline_at::timestamp + TIME '09:00')::timestamptz
            END,
            applications.second_reminder_lead_minutes
          ),
          (
            'interview',
            applications.interview_at,
            applications.second_reminder_lead_minutes
          ),
          (
            'offer_deadline',
            CASE
              WHEN applications.offer_deadline_at IS NULL THEN NULL
              ELSE (applications.offer_deadline_at::timestamp + TIME '09:00')::timestamptz
            END,
            applications.second_reminder_lead_minutes
          )
      ) AS event_data(event_kind, event_at, reminder_lead_minutes)
      JOIN users ON users.id = applications.user_id
      WHERE applications.notifications_enabled = TRUE
      AND event_data.event_at IS NOT NULL
      AND event_data.reminder_lead_minutes IS NOT NULL
      AND (
        users.settings->>'browserNotificationsEnabled' IS NULL
        OR users.settings->>'browserNotificationsEnabled' = 'true'
      )
      AND (
        event_data.event_kind != 'follow_up'
        OR users.settings->>'followUpRemindersEnabled' IS NULL
        OR users.settings->>'followUpRemindersEnabled' = 'true'
      )
      AND (
        event_data.event_kind != 'interview'
        OR users.settings->>'interviewRemindersEnabled' IS NULL
        OR users.settings->>'interviewRemindersEnabled' = 'true'
      )
      AND (
        event_data.event_kind NOT IN ('deadline', 'offer_deadline')
        OR users.settings->>'deadlineRemindersEnabled' IS NULL
        OR users.settings->>'deadlineRemindersEnabled' = 'true'
      )
    )
    SELECT
      application_events.*,
      push_subscriptions.subscription
    FROM application_events
    JOIN push_subscriptions
      ON push_subscriptions.user_id = application_events.user_id
    LEFT JOIN notification_deliveries
      ON notification_deliveries.application_id = application_events.application_id
      AND notification_deliveries.event_kind = application_events.event_kind
      AND notification_deliveries.reminder_lead_minutes = application_events.reminder_lead_minutes
      AND notification_deliveries.event_at = application_events.event_at
    WHERE notification_deliveries.id IS NULL
    AND application_events.event_at - make_interval(mins => application_events.reminder_lead_minutes) <= NOW()
    AND application_events.event_at - make_interval(mins => application_events.reminder_lead_minutes) >= NOW() - make_interval(mins => $1)
    ORDER BY application_events.event_at ASC
    LIMIT 100
    `,
		[reminderWindowMinutes],
	);

	return result.rows;
}

async function recordDelivery(row) {
	await pool.query(
		`
    INSERT INTO notification_deliveries (
      user_id,
      application_id,
      event_kind,
      reminder_lead_minutes,
      event_at
    )
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (application_id, event_kind, reminder_lead_minutes, event_at)
    DO NOTHING
    `,
		[
			row.user_id,
			row.application_id,
			row.event_kind,
			row.reminder_lead_minutes,
			row.event_at,
		],
	);
}

export async function processDueApplicationNotifications() {
	const dueNotifications = await getDueNotifications();

	for (const row of dueNotifications) {
		const result = await sendPushNotification(
			row.subscription,
			buildNotificationPayload(row),
		);

		if (result.sent) {
			await recordDelivery(row);
		}
	}

	return dueNotifications.length;
}

export function startApplicationNotificationScheduler() {
	const intervalMs = Number(process.env.NOTIFICATION_POLL_INTERVAL_MS || 60000);

	if (process.env.DISABLE_NOTIFICATION_SCHEDULER === "true") {
		return;
	}

	const run = () => {
		processDueApplicationNotifications().catch((error) => {
			console.error("Notification scheduler failed:", error);
		});
	};

	setTimeout(run, 10000);
	setInterval(run, intervalMs);
}
