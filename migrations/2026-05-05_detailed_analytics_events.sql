-- One-time production helper for detailed analytics fields.
-- Safe alternative: deploy functions first and let ensureCommerceSchema self-heal these columns.
ALTER TABLE user_events ADD COLUMN source TEXT;
ALTER TABLE user_events ADD COLUMN medium TEXT;
ALTER TABLE user_events ADD COLUMN campaign TEXT;
ALTER TABLE user_events ADD COLUMN device_type TEXT;
ALTER TABLE user_events ADD COLUMN page_path TEXT;
ALTER TABLE user_events ADD COLUMN referrer TEXT;
ALTER TABLE user_events ADD COLUMN session_id TEXT;
ALTER TABLE user_events ADD COLUMN anonymous_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_events_clerk_created ON user_events(clerk_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_type_created ON user_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_campaign ON user_events(campaign);
