DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_logs' AND column_name = 'contact')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_logs' AND column_name = 'contact_identifier') THEN
    ALTER TABLE automation_logs RENAME COLUMN contact TO contact_identifier;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_logs' AND column_name = 'type')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_logs' AND column_name = 'contact_type') THEN
    ALTER TABLE automation_logs RENAME COLUMN type TO contact_type;
  END IF;
END $$;

UPDATE automation_logs SET status = 'sent' WHERE status LIKE 'sent%';
UPDATE automation_logs SET status = 'failed' WHERE status LIKE 'failed%';
ALTER TABLE automation_logs ALTER COLUMN status SET DEFAULT 'pending';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'automation_logs_status_check') THEN
    ALTER TABLE automation_logs ADD CONSTRAINT automation_logs_status_check CHECK (status IN ('sent', 'failed', 'pending'));
  END IF;
END $$;
