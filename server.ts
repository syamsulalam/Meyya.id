import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Database initialization
  const db = new Database('meyya.db');
  db.pragma('journal_mode = WAL');

  db.exec(`
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS product_colors;
    DROP TABLE IF EXISTS product_sizes;
    DROP TABLE IF EXISTS shipping_costs;
    DROP TABLE IF EXISTS shipping_settings;
    
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      phone_wa TEXT,
      role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
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
      postal_code TEXT,
      street_address TEXT,
      is_default INTEGER
    );

    CREATE TABLE IF NOT EXISTS shipping_settings (
      id INTEGER PRIMARY KEY,
      origin_village_code TEXT,
      origin_village_name TEXT,
      active_couriers TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE,
      name TEXT
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
      weight INTEGER DEFAULT 250,
      is_active INTEGER,
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

    CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      discount_type TEXT,
      discount_value INTEGER,
      min_purchase INTEGER,
      valid_from DATETIME,
      valid_until DATETIME,
      usage_limit INTEGER,
      used_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      address_snapshot TEXT,
      subtotal INTEGER,
      shipping_cost INTEGER,
      shipping_discount INTEGER,
      product_discount INTEGER,
      voucher_id INTEGER,
      unique_code INTEGER,
      total_paid INTEGER,
      total_profit INTEGER,
      status TEXT,
      receipt_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
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

    CREATE TABLE IF NOT EXISTS wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      product_id INTEGER
    );
  `);

  // Seed Data
  const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (categoriesCount.count === 0) {
    db.exec(`
      INSERT INTO categories (slug, name) VALUES ('pashmina', 'Pashmina');
      INSERT INTO categories (slug, name) VALUES ('abaya', 'Abaya');
      INSERT INTO categories (slug, name) VALUES ('khimar', 'Khimar');
      INSERT INTO categories (slug, name) VALUES ('inner', 'Inner');
      INSERT INTO categories (slug, name) VALUES ('aksesoris', 'Aksesoris');

      INSERT INTO shipping_settings (id, origin_village_code, origin_village_name, active_couriers) 
      VALUES (1, '3174050001', 'GROGOL UTARA', '["JNE", "SiCepat", "JT", "paxel"]');

      /* Product 1: Pashmina Silk */
      INSERT INTO products (category_id, name, slug, description, image_url, base_price, production_cost, is_active, weight)
      VALUES (1, 'Pashmina Silk Premium', 'pashmina-silk-premium', 'Pashmina silk premium dengan drape yang indah dan sentuhan mewah (luxurious feel).', 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=600', 150000, 80000, 1, 150);
      
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
      VALUES (5, 'Vintage Pearl Brooch', 'vintage-pearl-brooch', 'Bros mutiara elegan (elegant pearl brooch) untuk mempercantik tampilan hijab atau dress Anda.', 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=600&auto=format&fit=crop', 120000, 50000, 1, 50);
      
      INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (6, 'Gold/Pearl', '#FFD700');
      INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (6, 'Silver/Pearl', '#C0C0C0');
      INSERT INTO product_sizes (product_id, size_name) VALUES (6, 'All Fit');
    `);
  }

  // API Routes
  app.get('/api/products', (req, res) => {
    try {
      const products = db.prepare('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE is_active = 1').all() as any[];
      
      for (const p of products) {
        p.colors = db.prepare('SELECT color_name, hex_code FROM product_colors WHERE product_id = ?').all(p.id);
        p.sizes = db.prepare('SELECT size_name FROM product_sizes WHERE product_id = ?').all(p.id);
      }
      res.json(products);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/products/:slug', (req, res) => {
    try {
      const p = db.prepare('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.slug = ?').get(req.params.slug) as any;
      if (!p) return res.status(404).json({ error: 'Not found' });
      
      p.colors = db.prepare('SELECT color_name, hex_code FROM product_colors WHERE product_id = ?').all(p.id);
      p.sizes = db.prepare('SELECT size_name FROM product_sizes WHERE product_id = ?').all(p.id);
      
      res.json(p);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const API_KEY = process.env['API.CO.ID_API'] || 'sk-test';

  // API Proxy for api.co.id regions
  app.get('/api/regions/:type', async (req, res) => {
    try {
      const { type } = req.params;
      const queryParams = new URLSearchParams(req.query as any).toString();
      const response = await fetch(`https://use.api.co.id/regional/indonesia/${type}?${queryParams}`, {
        headers: { 'x-api-co-id': API_KEY }
      });
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/regions/:type/:code/:subtype', async (req, res) => {
    try {
      const { type, code, subtype } = req.params;
      const queryParams = new URLSearchParams(req.query as any).toString();
      const response = await fetch(`https://use.api.co.id/regional/indonesia/${type}/${code}/${subtype}?${queryParams}`, {
        headers: { 'x-api-co-id': API_KEY }
      });
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Profile route
  app.get('/api/user/profile/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      // Ensure user exists
      let user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
      if (!user) {
        db.prepare(`
          INSERT INTO users (id, email, phone_wa, role) 
          VALUES (?, 'guest@example.com', '', 'customer')
        `).run(id);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
      }
      
      // Get address
      let address = db.prepare('SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC LIMIT 1').get(id) as any;
      
      res.json({
        user,
        address: address || null
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/user/profile/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { phone_wa, name, address } = req.body;
      
      // We don't have a name column in users table by default, but we can store it in address's recipient_name
      db.prepare('UPDATE users SET phone_wa = ? WHERE id = ?').run(phone_wa || '', id);
      
      if (address) {
        const existing = db.prepare('SELECT id FROM user_addresses WHERE user_id = ? LIMIT 1').get(id) as any;
        if (existing) {
          db.prepare(`
            UPDATE user_addresses 
            SET recipient_name = ?, recipient_phone = ?, 
                province_code = ?, province_name = ?, 
                regency_code = ?, regency_name = ?, 
                district_code = ?, district_name = ?, 
                village_code = ?, village_name = ?, 
                postal_code = '', street_address = ?
            WHERE user_id = ?
          `).run(
            name || '', phone_wa || '',
            address.province_code, address.province_name,
            address.regency_code, address.regency_name,
            address.district_code, address.district_name,
            address.village_code, address.village_name,
            address.street_address,
            id
          );
        } else {
          db.prepare(`
            INSERT INTO user_addresses (
              user_id, recipient_name, recipient_phone, 
              province_code, province_name, 
              regency_code, regency_name, 
              district_code, district_name, 
              village_code, village_name, 
              postal_code, street_address, is_default
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, 1)
          `).run(
            id, name || '', phone_wa || '',
            address.province_code, address.province_name,
            address.regency_code, address.regency_name,
            address.district_code, address.district_name,
            address.village_code, address.village_name,
            address.street_address
          );
        }
      }
      
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API Proxy for shipping cost
  app.post('/api/shipping/calculate', async (req, res) => {
    try {
      const { destination_village_code, weight } = req.body;
      
      const settings = db.prepare('SELECT * FROM shipping_settings LIMIT 1').get() as any;
      const origin_village_code = settings?.origin_village_code || "3174050001";
      const active_couriers = settings?.active_couriers ? JSON.parse(settings.active_couriers) : ["JNE", "SiCepat", "JT", "paxel"];

      const params = new URLSearchParams({
        origin_village_code,
        destination_village_code,
        weight: weight.toString()
      });

      const response = await fetch(`https://use.api.co.id/expedition/shipping-cost?${params.toString()}`, {
        headers: { 'x-api-co-id': API_KEY }
      });
      
      const data = await response.json();
      
      // Filter the api.co.id results based on active couriers and valid prices
      if (data.status === 'success' && data.result) {
        data.result = data.result.filter((r: any) => 
          r.price > 0 && active_couriers.includes(r.courier_code)
        );
      }
      
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Keep old endpoint for orders with modified payload
  app.post('/api/orders', (req, res) => {
    try {
      const { user_id, address_snapshot, items, shipping_cost } = req.body;
      const unique_code = Math.floor(Math.random() * 900) + 100; // 100-999
      const order_id = `MYA-${Date.now()}-${unique_code}`;
      
      let subtotal = 0;
      let total_hpp = 0;
      let total_paid = 0;
      
      const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, product_name, color_name, size_name, quantity, price_at_purchase, hpp_at_purchase) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      
      db.transaction(() => {
        for (const item of items) {
          const product = db.prepare('SELECT base_price, production_cost FROM products WHERE id = ?').get(item.product_id) as any;
          subtotal += product.base_price * item.quantity;
          total_hpp += product.production_cost * item.quantity;
          insertItem.run(order_id, item.product_id, item.product_name, item.color, item.size, item.quantity, product.base_price, product.production_cost);
        }
        
        total_paid = subtotal + shipping_cost + unique_code;
        const total_profit = subtotal - total_hpp;
        
        db.prepare('INSERT INTO orders (id, user_id, address_snapshot, subtotal, shipping_cost, shipping_discount, product_discount, unique_code, total_paid, total_profit, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          order_id, user_id || 'guest', address_snapshot, subtotal, shipping_cost, 0, 0, unique_code, total_paid, total_profit, 'pending_payment'
        );
      })();
      
      res.json({ order_id, unique_code, total_paid });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/metrics', (req, res) => {
    try {
      const { omzet } = db.prepare('SELECT SUM(total_paid) as omzet FROM orders WHERE status != "cancelled"').get() as any;
      const { profit } = db.prepare('SELECT SUM(total_profit) as profit FROM orders WHERE status != "cancelled"').get() as any;
      const { count } = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
      res.json({ omzet: omzet || 0, profit: profit || 0, total_orders: count || 0 });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/orders', (req, res) => {
    try {
      const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as any[];
      res.json(orders);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  
  app.post('/api/admin/orders/:id/confirm', (req, res) => {
    try {
      db.prepare('UPDATE orders SET status = "processing" WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
