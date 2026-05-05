-- Apply once only if production has not already self-healed these columns.
-- SQLite/D1 does not support ALTER TABLE ADD COLUMN IF NOT EXISTS.

ALTER TABLE users ADD COLUMN phone_wa_verified_at DATETIME;
ALTER TABLE users ADD COLUMN phone_wa_verification_code TEXT;
ALTER TABLE users ADD COLUMN phone_wa_verification_requested_at DATETIME;
ALTER TABLE users ADD COLUMN phone_wa_verification_expires_at DATETIME;
