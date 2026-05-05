-- One-time production helper for daily analytics aggregate tables.
-- Safe alternative: deploy functions first and let ensureCommerceSchema create these tables.
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

CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_event ON analytics_daily_metrics(event_type, metric_date);
CREATE INDEX IF NOT EXISTS idx_user_event_summaries_updated ON user_event_summaries(updated_at);
