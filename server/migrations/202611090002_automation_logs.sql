CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID NOT NULL,
  contact TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone')),
  generated_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS automation_logs_user_created_idx ON automation_logs (user_id, created_at DESC);
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own automation logs" ON automation_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
