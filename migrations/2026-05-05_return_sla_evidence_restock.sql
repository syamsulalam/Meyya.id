ALTER TABLE return_requests ADD COLUMN evidence_urls TEXT;
ALTER TABLE return_requests ADD COLUMN sla_due_at DATETIME;
ALTER TABLE return_requests ADD COLUMN received_at DATETIME;
ALTER TABLE return_requests ADD COLUMN received_note TEXT;
ALTER TABLE return_requests ADD COLUMN stock_restored_at DATETIME;

UPDATE return_requests
SET sla_due_at = datetime(created_at, '+7 days')
WHERE sla_due_at IS NULL;
