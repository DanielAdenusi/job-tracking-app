ALTER TABLE applications
ADD COLUMN IF NOT EXISTS interview_location TEXT,
ADD COLUMN IF NOT EXISTS interview_mode TEXT,
ADD COLUMN IF NOT EXISTS reminder_lead_minutes INTEGER,
ADD COLUMN IF NOT EXISTS second_reminder_lead_minutes INTEGER,
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS visited_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_applications_deadline_at
ON applications(deadline_at);

CREATE INDEX IF NOT EXISTS idx_applications_interview_at
ON applications(interview_at);

CREATE INDEX IF NOT EXISTS idx_applications_visited_at
ON applications(visited_at);
