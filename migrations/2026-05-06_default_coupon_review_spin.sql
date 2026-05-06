-- Default coupon campaigns, user entitlements, and review spin rewards.
-- Run manually on remote D1 when ready:
-- npx wrangler d1 execute meyya_db --remote --file migrations/2026-05-06_default_coupon_review_spin.sql

CREATE TABLE IF NOT EXISTS coupon_campaigns (
  key TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  enabled INTEGER DEFAULT 1,
  trigger_type TEXT,
  discount_type TEXT,
  discount_value NUMERIC DEFAULT 0,
  min_purchase NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  expires_in_days INTEGER DEFAULT 14,
  usage_limit_global INTEGER DEFAULT 0,
  usage_limit_per_user INTEGER DEFAULT 1,
  requires_verified_wa INTEGER DEFAULT 1,
  requires_entitlement INTEGER DEFAULT 1,
  birthday_claim_window_days INTEGER,
  metadata TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon_entitlements (
  id TEXT PRIMARY KEY,
  campaign_key TEXT,
  voucher_code TEXT,
  clerk_id TEXT NOT NULL,
  status TEXT DEFAULT 'AVAILABLE',
  source_type TEXT,
  source_id TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  min_purchase NUMERIC,
  max_discount NUMERIC,
  applicable_product_ids TEXT,
  valid_from DATETIME,
  valid_until DATETIME,
  metadata TEXT,
  used_order_id TEXT,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wheel_prizes (
  key TEXT PRIMARY KEY,
  label TEXT,
  enabled INTEGER DEFAULT 1,
  voucher_code TEXT,
  discount_type TEXT,
  discount_value NUMERIC DEFAULT 0,
  min_purchase NUMERIC DEFAULT 0,
  max_discount_formula TEXT,
  min_purchase_formula TEXT,
  weight_first_spin INTEGER DEFAULT 0,
  weight_repeat_spin INTEGER DEFAULT 0,
  expires_in_days INTEGER DEFAULT 14,
  metadata TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS review_spin_entitlements (
  id TEXT PRIMARY KEY,
  review_id INTEGER UNIQUE,
  order_id TEXT,
  product_id INTEGER,
  clerk_id TEXT NOT NULL,
  status TEXT DEFAULT 'AVAILABLE',
  expires_at DATETIME,
  spun_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wheel_spins (
  id TEXT PRIMARY KEY,
  spin_entitlement_id TEXT UNIQUE,
  clerk_id TEXT NOT NULL,
  review_id INTEGER,
  prize_key TEXT,
  coupon_entitlement_id TEXT,
  is_first_spin INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE vouchers ADD COLUMN requires_entitlement INTEGER DEFAULT 0;
ALTER TABLE vouchers ADD COLUMN source_campaign_key TEXT;
ALTER TABLE voucher_usages ADD COLUMN coupon_entitlement_id TEXT;
ALTER TABLE product_reviews ADD COLUMN admin_reply TEXT;
ALTER TABLE product_reviews ADD COLUMN admin_replied_at DATETIME;
ALTER TABLE product_reviews ADD COLUMN admin_replied_by TEXT;
ALTER TABLE product_reviews ADD COLUMN is_featured INTEGER DEFAULT 0;
ALTER TABLE product_reviews ADD COLUMN moderation_note TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_entitlements_unique_source
ON coupon_entitlements(clerk_id, campaign_key, source_type, source_id)
WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_coupon_entitlements_available
ON coupon_entitlements(clerk_id, voucher_code, status, valid_until);

INSERT OR IGNORE INTO coupon_campaigns (key, title, description, enabled, trigger_type, discount_type, discount_value, min_purchase, max_discount, expires_in_days, usage_limit_per_user, requires_verified_wa, requires_entitlement, birthday_claim_window_days, metadata)
VALUES
  ('MEYYAWELCOME', 'Welcome Coupon', 'Kupon belanja pertama untuk customer baru yang sudah verifikasi WhatsApp.', 1, 'WELCOME', 'PERCENTAGE', 10, 200000, 25000, 14, 1, 1, 1, NULL, '{}'),
  ('BDAYGIFT', 'Birthday Gift', 'Kupon ulang tahun customer, 1x per tahun.', 1, 'BIRTHDAY', 'PERCENTAGE', 10, 250000, 50000, 7, 1, 1, 1, 7, '{}'),
  ('MEYYABDAY', 'Meyya Birthday', 'Campaign ulang tahun Meyya. Admin mengatur tanggal dan window campaign.', 0, 'BRAND_BIRTHDAY', 'PERCENTAGE', 12, 250000, 75000, 10, 1, 1, 1, NULL, '{"month":1,"day":1,"window_before_days":3,"window_after_days":7}'),
  ('REVIEWSPIN', 'Review Spin', 'Kesempatan spin wheel setelah review valid dari order selesai.', 1, 'REVIEW_SPIN', 'SPIN', 0, 0, NULL, 14, 0, 1, 1, NULL, '{}');

INSERT OR IGNORE INTO vouchers (code, discount_type, discount_value, min_purchase, max_discount, usage_limit, used_count, target_user_role, target_segment, birthday_claim_window_days, requires_entitlement, source_campaign_key)
VALUES
  ('MEYYAWELCOME', 'PERCENTAGE', 10, 200000, 25000, 0, 0, 'NEW_USER', 'WELCOME', NULL, 1, 'MEYYAWELCOME'),
  ('BDAYGIFT', 'PERCENTAGE', 10, 250000, 50000, 0, 0, 'BIRTHDAY', 'BIRTHDAY', 7, 1, 'BDAYGIFT'),
  ('MEYYABDAY', 'PERCENTAGE', 12, 250000, 75000, 0, 0, 'ALL', 'BRAND_BIRTHDAY', NULL, 1, 'MEYYABDAY');

INSERT OR IGNORE INTO wheel_prizes (key, label, enabled, voucher_code, discount_type, discount_value, min_purchase, max_discount_formula, min_purchase_formula, weight_first_spin, weight_repeat_spin, expires_in_days, metadata)
VALUES
  ('SHIP5_NO_MIN', 'Diskon Ongkir Rp5.000', 1, 'REVIEWONGKIR5', 'FREE_SHIPPING', 5000, 0, NULL, NULL, 45, 30, 7, '{}'),
  ('SMALL_FIXED', 'Diskon Rp10.000', 1, 'REVIEW10K', 'FIXED', 10000, 200000, NULL, NULL, 25, 18, 14, '{}'),
  ('SHIP10_MIN', 'Diskon Ongkir Rp10.000', 1, 'REVIEWONGKIR10', 'FREE_SHIPPING', 10000, 250000, NULL, NULL, 20, 12, 14, '{}'),
  ('REVIEW_MAX20_LAST_ORDER', 'Diskon 20% transaksi terakhir', 1, 'REVIEW20', 'PERCENTAGE', 20, 0, 'LAST_ORDER_SUBTOTAL_20_PERCENT', 'LAST_ORDER_SUBTOTAL', 2, 1, 30, '{}'),
  ('FREE_PRODUCT_10_LAST_ORDER', 'Free product pool 10%', 0, 'REVIEWFREE10', 'FIXED', 0, 0, 'LAST_ORDER_SUBTOTAL_10_PERCENT', 'LAST_ORDER_SUBTOTAL', 0, 0, 30, '{"note":"Disabled until free product auto-pick is implemented."}'),
  ('TRY_AGAIN', 'Coba Lagi', 1, NULL, 'NONE', 0, 0, NULL, NULL, 0, 35, 0, '{}');

INSERT OR IGNORE INTO vouchers (code, discount_type, discount_value, min_purchase, max_discount, usage_limit, used_count, target_user_role, target_segment, requires_entitlement, source_campaign_key)
VALUES
  ('REVIEWONGKIR5', 'FREE_SHIPPING', 5000, 0, NULL, 0, 0, 'ALL', 'REVIEW_SPIN', 1, 'REVIEWSPIN'),
  ('REVIEW10K', 'FIXED', 10000, 200000, NULL, 0, 0, 'ALL', 'REVIEW_SPIN', 1, 'REVIEWSPIN'),
  ('REVIEWONGKIR10', 'FREE_SHIPPING', 10000, 250000, NULL, 0, 0, 'ALL', 'REVIEW_SPIN', 1, 'REVIEWSPIN'),
  ('REVIEW20', 'PERCENTAGE', 20, 0, NULL, 0, 0, 'ALL', 'REVIEW_SPIN', 1, 'REVIEWSPIN'),
  ('REVIEWFREE10', 'FIXED', 0, 0, NULL, 0, 0, 'ALL', 'REVIEW_SPIN', 1, 'REVIEWSPIN');
