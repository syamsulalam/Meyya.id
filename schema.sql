-- D1 Database Schema Dump untuk MEYYA.ID

DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS product_colors;
DROP TABLE IF EXISTS product_sizes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS user_addresses;
DROP TABLE IF EXISTS shipping_settings;
DROP TABLE IF EXISTS vouchers;
DROP TABLE IF EXISTS voucher_usages;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS wishlists;

CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE,
  name TEXT,
  image_url TEXT
);

CREATE TABLE products (
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_colors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  color_name TEXT,
  hex_code TEXT
);

CREATE TABLE product_sizes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  size_name TEXT
);

CREATE TABLE users (
  clerk_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone_wa TEXT,
  role TEXT,
  last_login_at DATETIME,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_addresses (
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

CREATE TABLE shipping_settings (
  id INTEGER PRIMARY KEY,
  origin_village_code TEXT,
  origin_village_name TEXT,
  active_couriers TEXT -- Menampung array list dari JSON "["JNE", "SiCepat", "SAP"]"
);

CREATE TABLE vouchers (
  code TEXT PRIMARY KEY,
  discount_type TEXT,
  discount_value numeric,
  min_purchase numeric DEFAULT 0,
  max_discount numeric,
  valid_from DATETIME,
  valid_until DATETIME,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  target_user_role TEXT DEFAULT 'all'
);

CREATE TABLE voucher_usages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_code TEXT,
  clerk_id TEXT,
  order_id TEXT,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT,
  product_id INTEGER,
  product_name TEXT,
  color_name TEXT,
  size_name TEXT,
  quantity INTEGER,
  price_at_purchase INTEGER,
  hpp_at_purchase INTEGER
);

CREATE TABLE wishlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  product_id INTEGER
);


-- ================= SEEDER (Data Awal) =================

INSERT INTO categories (slug, name) VALUES ('pashmina', 'Pashmina');
INSERT INTO categories (slug, name) VALUES ('abaya', 'Abaya');
INSERT INTO categories (slug, name) VALUES ('khimar', 'Khimar');
INSERT INTO categories (slug, name) VALUES ('inner', 'Inner');
INSERT INTO categories (slug, name) VALUES ('aksesoris', 'Aksesoris');

/* Settings Expedisi Default - Harus diedit via Admin / Database */
INSERT INTO shipping_settings (id, origin_village_code, origin_village_name, active_couriers) 
VALUES (1, '3174050001', 'GROGOL UTARA', '["JNE", "SiCepat", "JT", "paxel"]');

/* Product 1: Pashmina Silk */
INSERT INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (1, 'Pashmina Silk Premium', 'pashmina-silk-premium', 'Pashmina silk premium dengan drape yang indah dan sentuhan mewah.', 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=600', 150000, 80000, 1, 150);

INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (1, 'Dusty Pink', '#DCAE96');
INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (1, 'Olive Green', '#808000');
INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (1, 'Navy Blue', '#000080');
INSERT INTO product_sizes (product_id, size_name) VALUES (1, 'All Size');

/* Product 2: Classic Abaya */
INSERT INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (2, 'Abaya Noir Classic', 'abaya-noir-classic', 'Abaya berpotongan klasik (classic cut) yang elegan.', 'https://images.unsplash.com/photo-1610486808796-039c36ec3b2a?auto=format&fit=crop&q=80&w=600', 450000, 200000, 1, 600);

INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (2, 'Midnight Black', '#1a1a1a');
INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (2, 'Maroon', '#800000');
INSERT INTO product_sizes (product_id, size_name) VALUES (2, 'S');
INSERT INTO product_sizes (product_id, size_name) VALUES (2, 'M');
INSERT INTO product_sizes (product_id, size_name) VALUES (2, 'L');
INSERT INTO product_sizes (product_id, size_name) VALUES (2, 'XL');

/* Product 3: Flowy Khimar */
INSERT INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (3, 'Khimar Flowy Voile', 'khimar-flowy-voile', 'Khimar layer ganda yang sangat jatuh (flowy).', 'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?q=80&w=600&auto=format&fit=crop', 220000, 110000, 1, 300);

INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (3, 'Soft Charcoal', '#36454F');
INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (3, 'Warm Sand', '#E0C5A0');
INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (3, 'Pure White', '#FFFFFF');
INSERT INTO product_sizes (product_id, size_name) VALUES (3, 'Standard');
INSERT INTO product_sizes (product_id, size_name) VALUES (3, 'Jumbo');

/* Product 4: Abaya Outer */
INSERT INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (2, 'Abaya Outer Signature', 'abaya-outer-signature', 'Outer abaya dengan detail bordir (embroidery) premium.', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=600&auto=format&fit=crop', 600000, 250000, 1, 450);

INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (4, 'Emerald', '#50C878');
INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (4, 'Taupe', '#483C32');
INSERT INTO product_sizes (product_id, size_name) VALUES (4, 'All Size');

/* Product 5: Inner Rajut */
INSERT INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (4, 'Inner Ninja Premium', 'inner-ninja-premium', 'Ciput ninja rajut anti pusing. Fleksibel, menyerap keringat.', 'https://images.unsplash.com/photo-1574682701768-fa24597b4a2c?q=80&w=600&auto=format&fit=crop', 50000, 20000, 1, 80);

INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (5, 'Black', '#000000');
INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (5, 'Nude', '#E3BC9A');
INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (5, 'Dark Grey', '#A9A9A9');
INSERT INTO product_sizes (product_id, size_name) VALUES (5, 'All Size');

/* Product 6: Aksesoris Brooch */
INSERT INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (5, 'Vintage Pearl Brooch', 'vintage-pearl-brooch', 'Bros mutiara elegan (elegant pearl brooch) untuk mempercantik tampilan hijab.', 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=600&auto=format&fit=crop', 120000, 50000, 1, 50);

INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (6, 'Gold/Pearl', '#FFD700');
INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (6, 'Silver/Pearl', '#C0C0C0');
INSERT INTO product_sizes (product_id, size_name) VALUES (6, 'All Fit');
