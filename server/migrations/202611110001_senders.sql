-- OAuth-connected sender profiles (Gmail / WhatsApp) used by workflows.
-- Token material is stored encrypted by the API and is never returned to the CMS.

CREATE TABLE IF NOT EXISTS senders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  provider TEXT NOT NULL CHECK (provider IN ('google', 'meta')),
  account TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'expired', 'revoked')),
  scopes TEXT[] NOT NULL DEFAULT '{}',
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  provider_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_connected_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One profile per provider account per user; reconnecting updates the same row.
CREATE UNIQUE INDEX IF NOT EXISTS senders_user_provider_account_idx
  ON senders (user_id, provider, account);

CREATE INDEX IF NOT EXISTS senders_user_channel_idx ON senders (user_id, channel);

-- Short-lived CSRF state for in-flight provider authorization redirects.
CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'meta')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  sender_id UUID REFERENCES senders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS oauth_states_expires_idx ON oauth_states (expires_at);

ALTER TABLE senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own senders" ON senders;
CREATE POLICY "Users can manage their own senders" ON senders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own oauth states" ON oauth_states;
CREATE POLICY "Users can manage their own oauth states" ON oauth_states
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
