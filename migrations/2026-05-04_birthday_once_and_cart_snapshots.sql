CREATE TABLE IF NOT EXISTS user_cart_snapshots (
  clerk_id TEXT PRIMARY KEY,
  item_count INTEGER DEFAULT 0,
  subtotal INTEGER DEFAULT 0,
  product_ids TEXT,
  items TEXT,
  status TEXT DEFAULT 'ACTIVE',
  last_event_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  converted_order_id TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE voucher_usages ADD COLUMN usage_type TEXT;
ALTER TABLE voucher_usages ADD COLUMN claim_year INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_voucher_usages_birthday_year
ON voucher_usages(clerk_id, claim_year)
WHERE usage_type = 'BIRTHDAY';
