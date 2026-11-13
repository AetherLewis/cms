-- OAuth credentials are only accessed by the API's service role.
CREATE TABLE IF NOT EXISTS sender_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'whatsapp')),
  provider_account_id TEXT NOT NULL,
  waba_id TEXT,
  phone_number_id TEXT,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'expired', 'disconnected')),
  encrypted_access_token TEXT,
  encrypted_refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  last_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS sender_profiles_user_provider_idx ON sender_profiles (user_id, provider);
ALTER TABLE sender_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own sender profiles" ON sender_profiles;
CREATE POLICY "Users can manage their own sender profiles" ON sender_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
REVOKE SELECT (encrypted_access_token, encrypted_refresh_token) ON sender_profiles FROM anon, authenticated;
REVOKE SELECT ON sender_profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, name, provider, provider_account_id, waba_id, phone_number_id, status, token_expires_at, last_connected_at, created_at, updated_at)
  ON sender_profiles TO authenticated;

-- The earlier sender table remains for migration compatibility; do not expose its token columns either.
REVOKE SELECT ON senders FROM anon, authenticated;

ALTER TABLE workflows ADD COLUMN IF NOT EXISTS sender_profile_id UUID NULL
  REFERENCES sender_profiles(id) ON DELETE SET NULL;
