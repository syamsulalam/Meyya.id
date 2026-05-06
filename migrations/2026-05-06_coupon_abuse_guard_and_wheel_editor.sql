-- Advanced welcome coupon anti-abuse guard and admin wheel/campaign editor fields.
-- Run manually on remote D1 when ready:
-- npx wrangler d1 execute meyya-id --remote --file migrations/2026-05-06_coupon_abuse_guard_and_wheel_editor.sql

ALTER TABLE coupon_campaigns ADD COLUMN risk_block_threshold INTEGER DEFAULT 70;

CREATE TABLE IF NOT EXISTS coupon_claim_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_key TEXT NOT NULL,
  clerk_id TEXT NOT NULL,
  entitlement_id TEXT,
  signal_type TEXT NOT NULL,
  signal_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coupon_claim_signals_lookup
ON coupon_claim_signals(campaign_key, signal_type, signal_hash, created_at);

CREATE TABLE IF NOT EXISTS coupon_claim_risk_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_key TEXT NOT NULL,
  clerk_id TEXT NOT NULL,
  risk_score INTEGER DEFAULT 0,
  decision TEXT,
  reasons TEXT,
  signal_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coupon_claim_risk_logs_lookup
ON coupon_claim_risk_logs(campaign_key, clerk_id, created_at);
