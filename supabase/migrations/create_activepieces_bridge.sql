-- Activepieces bridge for ModelGrow runtime execution.
-- One ModelGrow user maps to one Activepieces account/project.
-- Runtime flows are per-user copies of developer/source flows used for token-based runs.

CREATE TABLE IF NOT EXISTS activepieces_user_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    activepieces_user_id TEXT,
    activepieces_project_id TEXT,
    activepieces_platform_id TEXT,
    activepieces_email TEXT NOT NULL,
    activepieces_role TEXT NOT NULL DEFAULT 'MEMBER',
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'ready', 'failed')),
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id),
    UNIQUE (activepieces_project_id)
);

CREATE TABLE IF NOT EXISTS activepieces_runtime_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    activepieces_project_id TEXT NOT NULL,
    activepieces_flow_id TEXT NOT NULL,
    activepieces_source_project_id TEXT,
    activepieces_source_flow_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'active', 'paused', 'failed', 'deleted')),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, automation_id),
    UNIQUE (activepieces_flow_id)
);

ALTER TABLE automations
    ADD COLUMN IF NOT EXISTS activepieces_source_flow_id TEXT,
    ADD COLUMN IF NOT EXISTS activepieces_source_project_id TEXT,
    ADD COLUMN IF NOT EXISTS activepieces_trigger_type TEXT NOT NULL DEFAULT 'webhook';

ALTER TABLE automation_executions
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_activepieces_user_links_user_id
    ON activepieces_user_links(user_id);

CREATE INDEX IF NOT EXISTS idx_activepieces_runtime_flows_user_id
    ON activepieces_runtime_flows(user_id);

CREATE INDEX IF NOT EXISTS idx_activepieces_runtime_flows_automation_id
    ON activepieces_runtime_flows(automation_id);

CREATE INDEX IF NOT EXISTS idx_automations_activepieces_source_flow_id
    ON automations(activepieces_source_flow_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_activepieces_user_links_updated_at
    ON activepieces_user_links;
CREATE TRIGGER update_activepieces_user_links_updated_at
    BEFORE UPDATE ON activepieces_user_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_activepieces_runtime_flows_updated_at
    ON activepieces_runtime_flows;
CREATE TRIGGER update_activepieces_runtime_flows_updated_at
    BEFORE UPDATE ON activepieces_runtime_flows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE activepieces_user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE activepieces_runtime_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Activepieces user link"
    ON activepieces_user_links FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own Activepieces runtime flows"
    ON activepieces_runtime_flows FOR SELECT
    USING (auth.uid() = user_id);

COMMENT ON TABLE activepieces_user_links IS 'Maps one ModelGrow user to one linked Activepieces user/project';
COMMENT ON TABLE activepieces_runtime_flows IS 'Per-user Activepieces flow copies used when running ModelGrow automations';
COMMENT ON COLUMN automations.activepieces_source_flow_id IS 'Developer/source Activepieces flow copied into each user project at runtime';
