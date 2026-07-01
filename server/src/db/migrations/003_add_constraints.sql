-- Automatically update updated_at columns
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS applications_set_updated_at ON applications;

CREATE TRIGGER applications_set_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- Status constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'applications_status_check'
  ) THEN
    ALTER TABLE applications
    ADD CONSTRAINT applications_status_check
    CHECK (
      status IN (
        'wishlist',
        'saved',
        'applied',
        'assessment',
        'interviewing',
        'offer',
        'rejected',
        'withdrawn'
      )
    );
  END IF;
END $$;


-- Priority constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'applications_priority_check'
  ) THEN
    ALTER TABLE applications
    ADD CONSTRAINT applications_priority_check
    CHECK (
      priority IN (
        'low',
        'medium',
        'high'
      )
    );
  END IF;
END $$;


-- Employment type constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'applications_employment_type_check'
  ) THEN
    ALTER TABLE applications
    ADD CONSTRAINT applications_employment_type_check
    CHECK (
      employment_type IS NULL
      OR employment_type IN (
        'full_time',
        'part_time',
        'internship',
        'placement',
        'contract',
        'temporary',
        'freelance'
      )
    );
  END IF;
END $$;


-- Work mode constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'applications_work_mode_check'
  ) THEN
    ALTER TABLE applications
    ADD CONSTRAINT applications_work_mode_check
    CHECK (
      work_mode IS NULL
      OR work_mode IN (
        'remote',
        'hybrid',
        'onsite'
      )
    );
  END IF;
END $$;


-- Basic URL constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'applications_job_url_check'
  ) THEN
    ALTER TABLE applications
    ADD CONSTRAINT applications_job_url_check
    CHECK (
      job_url IS NULL
      OR job_url = ''
      OR job_url ~* '^https?://'
    );
  END IF;
END $$;


-- Basic email constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'applications_contact_email_check'
  ) THEN
    ALTER TABLE applications
    ADD CONSTRAINT applications_contact_email_check
    CHECK (
      contact_email IS NULL
      OR contact_email = ''
      OR contact_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    );
  END IF;
END $$;


-- Useful indexes for dashboard/filtering
CREATE INDEX IF NOT EXISTS idx_applications_user_status
ON applications(user_id, status);

CREATE INDEX IF NOT EXISTS idx_applications_user_priority
ON applications(user_id, priority);

CREATE INDEX IF NOT EXISTS idx_applications_user_created_at
ON applications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_user_follow_up
ON applications(user_id, follow_up_at);