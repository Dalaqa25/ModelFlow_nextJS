-- Create webhook_events table to store incoming webhook events from various providers
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'tiktok', 'google', 'stripe', etc.
  event_type TEXT NOT NULL, -- 'video.published', 'comment.created', etc.
  payload JSONB NOT NULL, -- Full event data from provider
  processed BOOLEAN DEFAULT FALSE, -- Whether an automation has processed this event
  processed_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received ON webhook_events(received_at DESC);

-- RLS policies
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role has full access to webhook_events"
  ON webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users cannot access webhook events directly (only through API)
CREATE POLICY "Users cannot access webhook_events"
  ON webhook_events
  FOR ALL
  TO authenticated
  USING (false);
