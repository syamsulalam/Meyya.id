-- Production D1 schema patch for meyya-id.
-- Generated after comparing schema.sql with .context/d1-remote-schema.sql on 2026-05-04.
-- Apply once only. SQLite/D1 does not support ALTER TABLE ADD COLUMN IF NOT EXISTS.

ALTER TABLE users ADD COLUMN birth_date DATE;
ALTER TABLE wishlists ADD COLUMN created_at DATETIME;
UPDATE wishlists SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
ALTER TABLE payment_settings ADD COLUMN transfer_admin_fee INTEGER DEFAULT 0;
ALTER TABLE payment_settings ADD COLUMN qris_admin_fee INTEGER DEFAULT 0;
