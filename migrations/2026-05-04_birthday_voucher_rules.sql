-- Production D1 schema patch for birthday and product-specific voucher rules.
-- Apply once only. SQLite/D1 does not support ALTER TABLE ADD COLUMN IF NOT EXISTS.

ALTER TABLE vouchers ADD COLUMN birthday_claim_window_days INTEGER;
ALTER TABLE vouchers ADD COLUMN applicable_product_ids TEXT;
