export async function ensureCommerceSchema(env: any) {
  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      alt_text TEXT,
      sort_order INTEGER DEFAULT 0,
      is_primary INTEGER DEFAULT 0,
      color_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.MEYYA_DB.prepare(`
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
    )
  `).run();

  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      product_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_clerk_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      order_id TEXT,
      change_qty INTEGER NOT NULL,
      reason TEXT NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS inventory_reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      clerk_id TEXT NOT NULL,
      order_id TEXT,
      rating INTEGER NOT NULL,
      review_text TEXT,
      status TEXT DEFAULT 'PUBLISHED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.MEYYA_DB.prepare(`
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
    )
  `).run();

  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS product_related (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      related_product_id INTEGER NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `).run();

  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS product_bundles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      description TEXT,
      image_url TEXT,
      bundle_price INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS product_bundle_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bundle_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1
    )
  `).run();

  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS message_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      channel TEXT DEFAULT 'WHATSAPP',
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.MEYYA_DB.prepare(`
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
    )
  `).run();

  await env.MEYYA_DB.prepare(`
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
    )
  `).run();

  await env.MEYYA_DB.prepare(`
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
    )
  `).run();

  await env.MEYYA_DB.prepare(`
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
    )
  `).run();

  await env.MEYYA_DB.prepare(`
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
    )
  `).run();

  await env.MEYYA_DB.prepare(`
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
    )
  `).run();

  await env.MEYYA_DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_finance_transactions_date
    ON finance_transactions(transaction_date)
  `).run();

  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS finance_period_closings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_key TEXT UNIQUE NOT NULL,
      closed_by TEXT,
      closed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      snapshot TEXT
    )
  `).run();

  await addColumn(env, 'products', 'deleted_at', 'DATETIME');
  await addColumn(env, 'products', 'meta_title', 'TEXT');
  await addColumn(env, 'products', 'meta_description', 'TEXT');
  await addColumn(env, 'products', 'canonical_slug', 'TEXT');
  await addColumn(env, 'products', 'og_image_url', 'TEXT');
  await addColumn(env, 'products', 'low_stock_threshold', 'INTEGER DEFAULT 5');
  await addColumn(env, 'categories', 'deleted_at', 'DATETIME');
  await addColumn(env, 'orders', 'payment_expires_at', 'DATETIME');
  await addColumn(env, 'orders', 'payment_proof_url', 'TEXT');
  await addColumn(env, 'orders', 'payment_submitted_at', 'DATETIME');
  await addColumn(env, 'orders', 'tracking_number', 'TEXT');
  await addColumn(env, 'orders', 'tracking_courier', 'TEXT');
  await addColumn(env, 'orders', 'shipped_at', 'DATETIME');
  await addColumn(env, 'orders', 'completed_at', 'DATETIME');
  await addColumn(env, 'order_items', 'variant_id', 'INTEGER');
  await addColumn(env, 'order_items', 'variant_options', 'TEXT');
  await addColumn(env, 'product_variants', 'option_signature', 'TEXT');
  await addColumn(env, 'product_variants', 'option_label', 'TEXT');
  await addColumn(env, 'inventory_reservations', 'variant_id', 'INTEGER');
  await addColumn(env, 'vouchers', 'target_clerk_id', 'TEXT');
  await addColumn(env, 'vouchers', 'target_segment', 'TEXT');
  await addColumn(env, 'wishlists', 'created_at', 'DATETIME');
  await addColumn(env, 'users', 'birth_date', 'DATE');
  await addColumn(env, 'user_events', 'product_id', 'INTEGER');
  await addColumn(env, 'user_events', 'order_id', 'TEXT');
  await addColumn(env, 'user_events', 'campaign_tag', 'TEXT');
  await addColumn(env, 'user_events', 'source', 'TEXT');
  await addColumn(env, 'user_events', 'medium', 'TEXT');
  await addColumn(env, 'user_events', 'campaign', 'TEXT');
  await addColumn(env, 'user_events', 'device_type', 'TEXT');
  await addColumn(env, 'user_events', 'page_path', 'TEXT');
  await addColumn(env, 'user_events', 'referrer', 'TEXT');
  await addColumn(env, 'user_events', 'session_id', 'TEXT');
  await addColumn(env, 'user_events', 'anonymous_id', 'TEXT');
  await addColumn(env, 'user_events', 'metadata', 'TEXT');
  await env.MEYYA_DB.prepare('CREATE INDEX IF NOT EXISTS idx_user_events_clerk_created ON user_events(clerk_id, created_at)').run();
  await env.MEYYA_DB.prepare('CREATE INDEX IF NOT EXISTS idx_user_events_type_created ON user_events(event_type, created_at)').run();
  await env.MEYYA_DB.prepare('CREATE INDEX IF NOT EXISTS idx_user_events_campaign ON user_events(campaign)').run();
  await addColumn(env, 'user_cart_snapshots', 'item_count', 'INTEGER DEFAULT 0');
  await addColumn(env, 'user_cart_snapshots', 'subtotal', 'INTEGER DEFAULT 0');
  await addColumn(env, 'user_cart_snapshots', 'product_ids', 'TEXT');
  await addColumn(env, 'user_cart_snapshots', 'items', 'TEXT');
  await addColumn(env, 'user_cart_snapshots', 'status', "TEXT DEFAULT 'ACTIVE'");
  await addColumn(env, 'user_cart_snapshots', 'last_event_at', 'DATETIME');
  await addColumn(env, 'user_cart_snapshots', 'converted_order_id', 'TEXT');
  await addColumn(env, 'user_cart_snapshots', 'updated_at', 'DATETIME');
  await addColumn(env, 'analytics_daily_metrics', 'page_path', 'TEXT DEFAULT ""');
  await addColumn(env, 'analytics_daily_metrics', 'unique_users', 'INTEGER DEFAULT 0');
  await addColumn(env, 'analytics_daily_metric_users', 'page_path', 'TEXT DEFAULT ""');
  await addColumn(env, 'user_event_summaries', 'last_referrer', 'TEXT');
  await addColumn(env, 'user_event_summaries', 'last_cart_at', 'DATETIME');
  await addColumn(env, 'user_event_summaries', 'last_product_view_at', 'DATETIME');
  await addColumn(env, 'user_event_summaries', 'last_checkout_at', 'DATETIME');
  await addColumn(env, 'user_event_summaries', 'campaign_touch_count', 'INTEGER DEFAULT 0');
  await addColumn(env, 'user_event_summaries', 'search_count', 'INTEGER DEFAULT 0');
  await addColumn(env, 'user_event_summaries', 'voucher_apply_count', 'INTEGER DEFAULT 0');
  await env.MEYYA_DB.prepare('CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily_metrics(metric_date)').run();
  await env.MEYYA_DB.prepare('CREATE INDEX IF NOT EXISTS idx_analytics_daily_event ON analytics_daily_metrics(event_type, metric_date)').run();
  await env.MEYYA_DB.prepare('CREATE INDEX IF NOT EXISTS idx_user_event_summaries_updated ON user_event_summaries(updated_at)').run();
  await addColumn(env, 'return_requests', 'evidence_urls', 'TEXT');
  await addColumn(env, 'return_requests', 'sla_due_at', 'DATETIME');
  await addColumn(env, 'return_requests', 'received_at', 'DATETIME');
  await addColumn(env, 'return_requests', 'received_note', 'TEXT');
  await addColumn(env, 'return_requests', 'warehouse_evidence_urls', 'TEXT');
  await addColumn(env, 'return_requests', 'decision', 'TEXT');
  await addColumn(env, 'return_requests', 'decision_note', 'TEXT');
  await addColumn(env, 'return_requests', 'qc_log', 'TEXT');
  await addColumn(env, 'return_requests', 'stock_restored_at', 'DATETIME');

  await env.MEYYA_DB.prepare(`
    INSERT OR IGNORE INTO message_templates (key, channel, title, body)
    VALUES
      ('payment_reminder', 'WHATSAPP', 'Pengingat Pembayaran', 'Halo {{name}}, pesanan {{order_id}} masih menunggu pembayaran sebesar Rp {{total_paid}}.'),
      ('order_shipped', 'WHATSAPP', 'Pesanan Dikirim', 'Halo {{name}}, pesanan {{order_id}} sudah dikirim via {{courier}} dengan resi {{tracking_number}}.'),
      ('order_completed', 'WHATSAPP', 'Pesanan Selesai', 'Halo {{name}}, terima kasih sudah belanja di MEYYA.ID. Bagikan review untuk pesanan {{order_id}} ya.')
  `).run();
}

async function addColumn(env: any, table: string, column: string, definition: string) {
  try {
    await env.MEYYA_DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  } catch (error: any) {
    if (!String(error?.message || '').toLowerCase().includes('duplicate column')) throw error;
  }
}

export async function auditLog(env: any, actorClerkId: string | null, action: string, entityType: string, entityId: string, metadata: any = {}) {
  await ensureCommerceSchema(env);
  await env.MEYYA_DB.prepare(`
    INSERT INTO audit_logs (actor_clerk_id, action, entity_type, entity_id, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).bind(actorClerkId || null, action, entityType, entityId, JSON.stringify(metadata || {})).run();
}

export async function expirePendingOrders(env: any) {
  await ensureCommerceSchema(env);

  const { results: expiredOrders } = await env.MEYYA_DB.prepare(`
    SELECT id FROM orders
    WHERE status = 'PENDING'
      AND payment_expires_at IS NOT NULL
      AND datetime(payment_expires_at) <= datetime('now')
  `).all();

  for (const order of expiredOrders || []) {
    await cancelOrderAndReleaseReservations(env, order.id, 'PAYMENT_EXPIRED');
  }

  return expiredOrders || [];
}

export async function cancelOrderAndReleaseReservations(env: any, orderId: string, reason: string) {
  await ensureCommerceSchema(env);

  const { results: reservations } = await env.MEYYA_DB.prepare(`
    SELECT * FROM inventory_reservations WHERE order_id = ? AND status = 'ACTIVE'
  `).bind(orderId).all();

  for (const reservation of reservations || []) {
    await env.MEYYA_DB.prepare(`
      UPDATE products SET stock = stock + ?, last_stock_update = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(reservation.quantity, reservation.product_id).run();

    if (reservation.variant_id) {
      await env.MEYYA_DB.prepare(`
        UPDATE product_variants SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(reservation.quantity, reservation.variant_id).run();
    }

    await env.MEYYA_DB.prepare(`
      INSERT INTO stock_movements (product_id, order_id, change_qty, reason, note)
      VALUES (?, ?, ?, ?, ?)
    `).bind(reservation.product_id, orderId, reservation.quantity, 'RESERVATION_RELEASED', reason).run();
  }

  await env.MEYYA_DB.prepare(`
    UPDATE inventory_reservations SET status = 'RELEASED' WHERE order_id = ? AND status = 'ACTIVE'
  `).bind(orderId).run();

  await env.MEYYA_DB.prepare(`
    UPDATE orders SET status = 'CANCELLED' WHERE id = ? AND status = 'PENDING'
  `).bind(orderId).run();
}
