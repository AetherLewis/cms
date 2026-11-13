-- Organization profile and invoicing defaults used by the Settings page.
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_address TEXT,
  company_email TEXT,
  company_logo TEXT,
  tax_pin TEXT,
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  currency TEXT NOT NULL DEFAULT 'KES',
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  payment_terms TEXT NOT NULL DEFAULT 'Net 30',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
