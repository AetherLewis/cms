-- Use Kenyan Shilling as the default currency for new workspace settings and contracts.
ALTER TABLE settings ALTER COLUMN currency SET DEFAULT 'KES';
ALTER TABLE contracts ALTER COLUMN currency SET DEFAULT 'KES';
