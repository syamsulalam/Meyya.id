import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
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

  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
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

  app.post('/api/products', (req, res) => {
    try {
      const { name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, is_active, colors } = req.body;
      const stmt = db.prepare('INSERT INTO products (name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, last_stock_update, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)');
      const info = stmt.run(name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, is_active);
      
      if (colors && colors.length > 0) {
        const insertColor = db.prepare('INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (?, ?, ?)');
        for (const c of colors) {
          insertColor.run(info.lastInsertRowid, c.color_name, c.hex_code);
        }
      }
      
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/products/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, is_active, colors } = req.body;
      
      // Update basic fields
      const stmt = db.prepare('UPDATE products SET name = ?, category_id = ?, slug = ?, description = ?, image_url = ?, base_price = ?, production_cost = ?, weight = ?, is_active = ? WHERE id = ?');
      stmt.run(name, category_id, slug, description, image_url, base_price, production_cost, weight, is_active, id);

      // Handle stock and stock update time separately
      const currentProduct = db.prepare('SELECT stock FROM products WHERE id = ?').get(id) as any;
      if (currentProduct && currentProduct.stock !== stock) {
        db.prepare('UPDATE products SET stock = ?, last_stock_update = CURRENT_TIMESTAMP WHERE id = ?').run(stock, id);
      }
      
      // Re-insert colors
      if (colors) {
        db.prepare('DELETE FROM product_colors WHERE product_id = ?').run(id);
        const insertColor = db.prepare('INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (?, ?, ?)');
        for (const c of colors) {
          insertColor.run(id, c.color_name, c.hex_code);
        }
      }

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/categories', (req, res) => {
    try {
      const categories = db.prepare(`
        SELECT c.*, COUNT(p.id) as count 
        FROM categories c 
        LEFT JOIN products p ON c.id = p.category_id 
        GROUP BY c.id
      `).all() as any[];
      res.json(categories);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/categories', (req, res) => {
    try {
      const { name, slug, image_url } = req.body;
      const stmt = db.prepare('INSERT INTO categories (name, slug, image_url) VALUES (?, ?, ?)');
      const info = stmt.run(name, slug, image_url);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/categories/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { name, slug, image_url } = req.body;
      const stmt = db.prepare('UPDATE categories SET name = ?, slug = ?, image_url = ? WHERE id = ?');
      stmt.run(name, slug, image_url, id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/categories/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
      res.json({ success: true });
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
