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
  target_segment TEXT
);

CREATE TABLE IF NOT EXISTS voucher_usages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_code TEXT,
  clerk_id TEXT,
  order_id TEXT,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  status TEXT DEFAULT 'REQUESTED',
  admin_note TEXT,
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

-- Seed basic payment setting
INSERT OR IGNORE INTO payment_settings (id, transfer_instruction) VALUES (1, 'Silakan transfer tepat sesuai nominal hingga 3 digit terakhir. Verifikasi manual dilakukan dalam 1x24 jam kerja.');

INSERT OR IGNORE INTO message_templates (key, channel, title, body) VALUES
  ('payment_reminder', 'WHATSAPP', 'Pengingat Pembayaran', 'Halo {{name}}, pesanan {{order_id}} masih menunggu pembayaran sebesar Rp {{total_paid}}.'),
  ('order_shipped', 'WHATSAPP', 'Pesanan Dikirim', 'Halo {{name}}, pesanan {{order_id}} sudah dikirim via {{courier}} dengan resi {{tracking_number}}.'),
  ('order_completed', 'WHATSAPP', 'Pesanan Selesai', 'Halo {{name}}, terima kasih sudah belanja di MEYYA.ID. Bagikan review untuk pesanan {{order_id}} ya.');


-- ================= SEEDER (Data Awal) =================

INSERT OR IGNORE INTO categories (slug, name) VALUES ('pashmina', 'Pashmina');
INSERT OR IGNORE INTO categories (slug, name) VALUES ('abaya', 'Abaya');
INSERT OR IGNORE INTO categories (slug, name) VALUES ('khimar', 'Khimar');
INSERT OR IGNORE INTO categories (slug, name) VALUES ('inner', 'Inner');
INSERT OR IGNORE INTO categories (slug, name) VALUES ('aksesoris', 'Aksesoris');

/* Settings Expedisi Default - Harus diedit via Admin / Database */
INSERT OR IGNORE INTO shipping_settings (id, origin_village_code, origin_village_name, active_couriers) 
VALUES (1, '3174050001', 'GROGOL UTARA', '["JNE", "SiCepat", "JT", "paxel"]');

/* Product 1: Pashmina Silk */
INSERT OR IGNORE INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (1, 'Pashmina Silk Premium', 'pashmina-silk-premium', 'Pashmina silk premium dengan drape yang indah dan sentuhan mewah.', 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=600', 150000, 80000, 1, 150);

INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (1, 'Dusty Pink', '#DCAE96');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (1, 'Olive Green', '#808000');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (1, 'Navy Blue', '#000080');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (1, 'All Size');

/* Product 2: Classic Abaya */
INSERT OR IGNORE INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (2, 'Abaya Noir Classic', 'abaya-noir-classic', 'Abaya berpotongan klasik (classic cut) yang elegan.', 'https://images.unsplash.com/photo-1610486808796-039c36ec3b2a?auto=format&fit=crop&q=80&w=600', 450000, 200000, 1, 600);

INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (2, 'Midnight Black', '#1a1a1a');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (2, 'Maroon', '#800000');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (2, 'S');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (2, 'M');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (2, 'L');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (2, 'XL');

/* Product 3: Flowy Khimar */
INSERT OR IGNORE INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (3, 'Khimar Flowy Voile', 'khimar-flowy-voile', 'Khimar layer ganda yang sangat jatuh (flowy).', 'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?q=80&w=600&auto=format&fit=crop', 220000, 110000, 1, 300);

INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (3, 'Soft Charcoal', '#36454F');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (3, 'Warm Sand', '#E0C5A0');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (3, 'Pure White', '#FFFFFF');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (3, 'Standard');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (3, 'Jumbo');

/* Product 4: Abaya Outer */
INSERT OR IGNORE INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (2, 'Abaya Outer Signature', 'abaya-outer-signature', 'Outer abaya dengan detail bordir (embroidery) premium.', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=600&auto=format&fit=crop', 600000, 250000, 1, 450);

INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (4, 'Emerald', '#50C878');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (4, 'Taupe', '#483C32');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (4, 'All Size');

/* Product 5: Inner Rajut */
INSERT OR IGNORE INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (4, 'Inner Ninja Premium', 'inner-ninja-premium', 'Ciput ninja rajut anti pusing. Fleksibel, menyerap keringat.', 'https://images.unsplash.com/photo-1574682701768-fa24597b4a2c?q=80&w=600&auto=format&fit=crop', 50000, 20000, 1, 80);

INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (5, 'Black', '#000000');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (5, 'Nude', '#E3BC9A');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (5, 'Dark Grey', '#A9A9A9');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (5, 'All Size');

/* Product 6: Aksesoris Brooch */
INSERT OR IGNORE INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (5, 'Vintage Pearl Brooch', 'vintage-pearl-brooch', 'Bros mutiara elegan (elegant pearl brooch) untuk mempercantik tampilan hijab.', 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=600&auto=format&fit=crop', 120000, 50000, 1, 50);

INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (6, 'Gold/Pearl', '#FFD700');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (6, 'Silver/Pearl', '#C0C0C0');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (6, 'All Fit');

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
