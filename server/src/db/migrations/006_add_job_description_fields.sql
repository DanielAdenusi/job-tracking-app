ALTER TABLE applications
ADD COLUMN IF NOT EXISTS hours_per_week TEXT,
ADD COLUMN IF NOT EXISTS job_reference_id TEXT,
ADD COLUMN IF NOT EXISTS job_description JSONB NOT NULL DEFAULT '{
  "role": [],
  "keyResponsibilities": [],
  "lookingFor": [],
  "desirable": [],
  "whyJoinUs": []
}'::jsonb;
