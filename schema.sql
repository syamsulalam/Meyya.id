-- D1 Database Schema Dump untuk MEYYA.ID

-- DROP TABLE IF EXISTS categories;
-- DROP TABLE IF EXISTS products;
-- DROP TABLE IF EXISTS product_colors;
-- DROP TABLE IF EXISTS product_sizes;
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS user_addresses;
-- DROP TABLE IF EXISTS shipping_settings;
-- DROP TABLE IF EXISTS vouchers;
-- DROP TABLE IF EXISTS voucher_usages;
-- DROP TABLE IF EXISTS orders;
-- DROP TABLE IF EXISTS order_items;
-- DROP TABLE IF EXISTS wishlists;

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE,
  name TEXT,
  image_url TEXT,
  has_colors INTEGER DEFAULT 0,
  has_sizes INTEGER DEFAULT 0,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  name TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  image_url TEXT,
  base_price INTEGER,
  production_cost INTEGER,
  weight INTEGER DEFAULT 250, -- Berat satuan (Fix for expedition API) dalam gram
  stock INTEGER DEFAULT 0,
  last_stock_update DATETIME,
  is_active INTEGER,
  is_preorder INTEGER DEFAULT 0,
  deleted_at DATETIME,
  meta_title TEXT,
  meta_description TEXT,
  canonical_slug TEXT,
  og_image_url TEXT,
  low_stock_threshold INTEGER DEFAULT 5,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_colors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  color_name TEXT,
  hex_code TEXT
);

CREATE TABLE IF NOT EXISTS product_sizes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  size_name TEXT
);

CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  color_name TEXT,
  size_name TEXT,
  option_signature TEXT,
  option_label TEXT,
  sku TEXT,
  stock INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary INTEGER DEFAULT 0,
  color_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  clerk_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone_wa TEXT,
  birth_date DATE,
  role TEXT,
  last_login_at DATETIME,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  label TEXT,
  icon TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  province_code TEXT,
  province_name TEXT,
  regency_code TEXT,
  regency_name TEXT,
  district_code TEXT,
  district_name TEXT,
  village_code TEXT,
  village_name TEXT,
  street_address TEXT,
  is_default INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shipping_settings (
  id INTEGER PRIMARY KEY,
  origin_village_code TEXT,
  origin_village_name TEXT,
  active_couriers TEXT -- Menampung array list dari JSON "["JNE", "SiCepat", "SAP"]"
);

CREATE TABLE IF NOT EXISTS region_cache (
  endpoint TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vouchers (
  code TEXT PRIMARY KEY,
  discount_type TEXT,
  discount_value numeric,
  min_purchase numeric DEFAULT 0,
  max_discount numeric,
  valid_from DATETIME,
  valid_until DATETIME,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  target_user_role TEXT DEFAULT 'all',
  target_clerk_id TEXT,
  target_segment TEXT,
  birthday_claim_window_days INTEGER,
  applicable_product_ids TEXT
);

CREATE TABLE IF NOT EXISTS voucher_usages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_code TEXT,
  clerk_id TEXT,
  order_id TEXT,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  usage_type TEXT,
  claim_year INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_voucher_usages_birthday_year
ON voucher_usages(clerk_id, claim_year)
WHERE usage_type = 'BIRTHDAY';

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  clerk_id TEXT,
  address_snapshot TEXT,
  status TEXT,
  payment_method TEXT,
  subtotal numeric,
  shipping_cost numeric,
  admin_fee numeric DEFAULT 0,
  order_bump numeric DEFAULT 0,
  unique_code numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  total_paid numeric,
  voucher_code TEXT,
  note TEXT,
  payment_expires_at DATETIME,
  payment_proof_url TEXT,
  payment_submitted_at DATETIME,
  tracking_number TEXT,
  tracking_courier TEXT,
  shipped_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT,
  product_id INTEGER,
  product_name TEXT,
  variant_id INTEGER,
  variant_options TEXT,
  color_name TEXT,
  size_name TEXT,
  quantity INTEGER,
  price_at_purchase INTEGER,
  hpp_at_purchase INTEGER
);

CREATE TABLE IF NOT EXISTS wishlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  product_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_clerk_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clerk_id TEXT,
  event_type TEXT NOT NULL,
  product_id INTEGER,
  order_id TEXT,
  campaign_tag TEXT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  device_type TEXT,
  page_path TEXT,
  referrer TEXT,
  session_id TEXT,
  anonymous_id TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS analytics_daily_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_date TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source TEXT DEFAULT '',
  medium TEXT DEFAULT '',
  campaign TEXT DEFAULT '',
  device_type TEXT DEFAULT '',
  page_path TEXT DEFAULT '',
  event_count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(metric_date, event_type, source, medium, campaign, device_type, page_path)
);

CREATE TABLE IF NOT EXISTS analytics_daily_metric_users (
  metric_date TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source TEXT DEFAULT '',
  medium TEXT DEFAULT '',
  campaign TEXT DEFAULT '',
  device_type TEXT DEFAULT '',
  page_path TEXT DEFAULT '',
  clerk_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(metric_date, event_type, source, medium, campaign, device_type, page_path, clerk_id)
);

CREATE TABLE IF NOT EXISTS user_event_summaries (
  clerk_id TEXT PRIMARY KEY,
  last_event_at DATETIME,
  last_event_type TEXT,
  last_source TEXT,
  last_medium TEXT,
  last_campaign TEXT,
  last_device_type TEXT,
  last_page_path TEXT,
  last_referrer TEXT,
  last_cart_at DATETIME,
  last_product_view_at DATETIME,
  last_checkout_at DATETIME,
  campaign_touch_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  voucher_apply_count INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  order_id TEXT,
  change_qty INTEGER NOT NULL,
  reason TEXT NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  variant_id INTEGER,
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  clerk_id TEXT NOT NULL,
  order_id TEXT,
  rating INTEGER NOT NULL,
  review_text TEXT,
  status TEXT DEFAULT 'PUBLISHED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS return_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  clerk_id TEXT NOT NULL,
  type TEXT DEFAULT 'RETURN',
  reason TEXT,
  evidence_urls TEXT,
  status TEXT DEFAULT 'REQUESTED',
  admin_note TEXT,
  sla_due_at DATETIME,
  received_at DATETIME,
  received_note TEXT,
  warehouse_evidence_urls TEXT,
  decision TEXT,
  decision_note TEXT,
  qc_log TEXT,
  stock_restored_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_related (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  related_product_id INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_bundles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  image_url TEXT,
  bundle_price INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_bundle_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bundle_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS message_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  channel TEXT DEFAULT 'WHATSAPP',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_settings (
  id INTEGER PRIMARY KEY,
  qris_image_url TEXT,
  qris_is_active INTEGER DEFAULT 0,
  transfer_instruction TEXT,
  payment_expiry_minutes INTEGER DEFAULT 1440,
  transfer_admin_fee INTEGER DEFAULT 0,
  qris_admin_fee INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_date DATE NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  description TEXT,
  amount INTEGER NOT NULL DEFAULT 0,
  attachment_url TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_date
  ON finance_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_user_events_clerk_created
  ON user_events(clerk_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_type_created
  ON user_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_campaign
  ON user_events(campaign);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date
  ON analytics_daily_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_event
  ON analytics_daily_metrics(event_type, metric_date);
CREATE INDEX IF NOT EXISTS idx_user_event_summaries_updated
  ON user_event_summaries(updated_at);

CREATE TABLE IF NOT EXISTS finance_period_closings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_key TEXT UNIQUE NOT NULL,
  closed_by TEXT,
  closed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  snapshot TEXT
);

CREATE TABLE IF NOT EXISTS category_attributes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  name TEXT NOT NULL,
  options TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS product_attributes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  attribute_name TEXT NOT NULL,
  attribute_value TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
