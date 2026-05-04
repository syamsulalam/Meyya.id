-- Demo seed data for local/staging only.
-- Production D1 migrations should use schema.sql and targeted migration files, not this demo seed.

INSERT OR IGNORE INTO payment_settings (id, transfer_instruction) VALUES (1, 'Silakan transfer tepat sesuai nominal hingga 3 digit terakhir. Verifikasi manual dilakukan dalam 1x24 jam kerja.');

INSERT OR IGNORE INTO message_templates (key, channel, title, body) VALUES
  ('payment_reminder', 'WHATSAPP', 'Pengingat Pembayaran', 'Halo {{name}}, pesanan {{order_id}} masih menunggu pembayaran sebesar Rp {{total_paid}}.'),
  ('order_shipped', 'WHATSAPP', 'Pesanan Dikirim', 'Halo {{name}}, pesanan {{order_id}} sudah dikirim via {{courier}} dengan resi {{tracking_number}}.'),
  ('order_completed', 'WHATSAPP', 'Pesanan Selesai', 'Halo {{name}}, terima kasih sudah belanja di MEYYA.ID. Bagikan review untuk pesanan {{order_id}} ya.');

INSERT OR IGNORE INTO categories (slug, name) VALUES ('pashmina', 'Pashmina');
INSERT OR IGNORE INTO categories (slug, name) VALUES ('abaya', 'Abaya');
INSERT OR IGNORE INTO categories (slug, name) VALUES ('khimar', 'Khimar');
INSERT OR IGNORE INTO categories (slug, name) VALUES ('inner', 'Inner');
INSERT OR IGNORE INTO categories (slug, name) VALUES ('aksesoris', 'Aksesoris');

INSERT OR IGNORE INTO shipping_settings (id, origin_village_code, origin_village_name, active_couriers)
VALUES (1, '3174050001', 'GROGOL UTARA', '["JNE", "SiCepat", "JT", "paxel"]');

INSERT OR IGNORE INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (1, 'Pashmina Silk Premium', 'pashmina-silk-premium', 'Pashmina silk premium dengan drape yang indah dan sentuhan mewah.', 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=600', 150000, 80000, 1, 150);

INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (1, 'Dusty Pink', '#DCAE96');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (1, 'Olive Green', '#808000');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (1, 'Navy Blue', '#000080');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (1, 'All Size');

INSERT OR IGNORE INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (2, 'Abaya Noir Classic', 'abaya-noir-classic', 'Abaya berpotongan klasik (classic cut) yang elegan.', 'https://images.unsplash.com/photo-1610486808796-039c36ec3b2a?auto=format&fit=crop&q=80&w=600', 450000, 200000, 1, 600);

INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (2, 'Midnight Black', '#1a1a1a');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (2, 'Maroon', '#800000');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (2, 'S');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (2, 'M');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (2, 'L');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (2, 'XL');

INSERT OR IGNORE INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (3, 'Khimar Flowy Voile', 'khimar-flowy-voile', 'Khimar layer ganda yang sangat jatuh (flowy).', 'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?q=80&w=600&auto=format&fit=crop', 220000, 110000, 1, 300);

INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (3, 'Soft Charcoal', '#36454F');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (3, 'Warm Sand', '#E0C5A0');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (3, 'Pure White', '#FFFFFF');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (3, 'Standard');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (3, 'Jumbo');

INSERT OR IGNORE INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (2, 'Abaya Outer Signature', 'abaya-outer-signature', 'Outer abaya dengan detail bordir (embroidery) premium.', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=600&auto=format&fit=crop', 600000, 250000, 1, 450);

INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (4, 'Emerald', '#50C878');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (4, 'Taupe', '#483C32');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (4, 'All Size');

INSERT OR IGNORE INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (4, 'Inner Ninja Premium', 'inner-ninja-premium', 'Ciput ninja rajut anti pusing. Fleksibel, menyerap keringat.', 'https://images.unsplash.com/photo-1574682701768-fa24597b4a2c?q=80&w=600&auto=format&fit=crop', 50000, 20000, 1, 80);

INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (5, 'Black', '#000000');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (5, 'Nude', '#E3BC9A');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (5, 'Dark Grey', '#A9A9A9');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (5, 'All Size');

INSERT OR IGNORE INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
VALUES (5, 'Vintage Pearl Brooch', 'vintage-pearl-brooch', 'Bros mutiara elegan (elegant pearl brooch) untuk mempercantik tampilan hijab.', 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=600&auto=format&fit=crop', 120000, 50000, 1, 50);

INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (6, 'Gold/Pearl', '#FFD700');
INSERT OR IGNORE INTO product_colors (product_id, color_name, hex_code) VALUES (6, 'Silver/Pearl', '#C0C0C0');
INSERT OR IGNORE INTO product_sizes (product_id, size_name) VALUES (6, 'All Fit');

