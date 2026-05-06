CREATE TABLE IF NOT EXISTS analytics_event_archives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  object_key TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  row_count INTEGER DEFAULT 0,
  deleted_count INTEGER DEFAULT 0,
  bytes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ARCHIVED',
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_analytics_archives_window
  ON analytics_event_archives(start_date, end_date);
