-- Stable bindings between imported workflow credential slots and encrypted
-- Activepieces connections. OAuth secrets remain only in Activepieces.

CREATE TABLE IF NOT EXISTS user_automation_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    credential_key TEXT NOT NULL,
    credential_type TEXT NOT NULL,
    connector_id TEXT NOT NULL,
    activepieces_piece_name TEXT NOT NULL,
    activepieces_project_id TEXT NOT NULL,
    activepieces_connection_external_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, automation_id, credential_key)
);

CREATE INDEX IF NOT EXISTS idx_user_automation_connections_lookup
    ON user_automation_connections(user_id, automation_id);

CREATE INDEX IF NOT EXISTS idx_user_automation_connections_external_id
    ON user_automation_connections(activepieces_connection_external_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_automation_connections_updated_at
    ON user_automation_connections;
CREATE TRIGGER update_user_automation_connections_updated_at
    BEFORE UPDATE ON user_automation_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE user_automation_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own automation connection bindings"
    ON user_automation_connections;
CREATE POLICY "Users can view own automation connection bindings"
    ON user_automation_connections FOR SELECT
    USING (auth.uid() = user_id);

COMMENT ON TABLE user_automation_connections IS
    'Non-secret bindings from imported workflow credential slots to encrypted Activepieces app connections';
COMMENT ON COLUMN user_automation_connections.credential_key IS
    'Stable hash of Activepieces piece plus imported n8n credential reference';
COMMENT ON COLUMN user_automation_connections.activepieces_connection_external_id IS
    'Identifier only; the encrypted OAuth value remains in Activepieces PostgreSQL';
