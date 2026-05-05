CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO app_settings (key, value)
VALUES ('support_whatsapp', '');

INSERT OR IGNORE INTO app_settings (key, value)
VALUES ('contact_whatsapp', '');

INSERT OR IGNORE INTO app_settings (key, value)
VALUES ('contact_uses_support_whatsapp', '1');

CREATE TABLE IF NOT EXISTS external_api_usage_monthly (
  provider TEXT NOT NULL,
  product TEXT NOT NULL,
  period_ym TEXT NOT NULL,
  calls INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (provider, product, period_ym)
);

CREATE TABLE IF NOT EXISTS shipping_quote_cache (
  cache_key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
