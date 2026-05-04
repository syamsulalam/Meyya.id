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

CREATE TABLE IF NOT EXISTS finance_period_closings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_key TEXT UNIQUE NOT NULL,
  closed_by TEXT,
  closed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  snapshot TEXT
);
