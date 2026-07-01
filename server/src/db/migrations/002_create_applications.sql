CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT,
  job_url TEXT,
  salary TEXT,

  status TEXT NOT NULL DEFAULT 'saved',
  priority TEXT NOT NULL DEFAULT 'medium',

  employment_type TEXT,
  work_mode TEXT,
  source TEXT,

  contact_name TEXT,
  contact_email TEXT,

  notes TEXT,

  applied_at DATE,
  follow_up_at DATE,
  deadline_at DATE,
  interview_at TIMESTAMPTZ,
  rejected_at DATE,
  offer_deadline_at DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id
ON applications(user_id);

CREATE INDEX IF NOT EXISTS idx_applications_status
ON applications(status);

CREATE INDEX IF NOT EXISTS idx_applications_follow_up_at
ON applications(follow_up_at);