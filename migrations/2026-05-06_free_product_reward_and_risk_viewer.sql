-- Free product review reward entitlements and coupon risk log admin viewer support.
-- Run manually on remote D1 when ready:
-- npx wrangler d1 execute meyya-id --remote --file migrations/2026-05-06_free_product_reward_and_risk_viewer.sql

ALTER TABLE coupon_entitlements ADD COLUMN applicable_product_ids TEXT;
