-- Split visible builder projects from hidden runtime projects.
-- Existing activepieces_project_id remains the legacy/builder project id.

ALTER TABLE activepieces_user_links
    ADD COLUMN IF NOT EXISTS activepieces_builder_project_id TEXT,
    ADD COLUMN IF NOT EXISTS activepieces_runtime_project_id TEXT;

UPDATE activepieces_user_links
SET activepieces_builder_project_id = activepieces_project_id
WHERE activepieces_builder_project_id IS NULL
  AND activepieces_project_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_activepieces_user_links_builder_project_id
    ON activepieces_user_links(activepieces_builder_project_id)
    WHERE activepieces_builder_project_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_activepieces_user_links_runtime_project_id
    ON activepieces_user_links(activepieces_runtime_project_id)
    WHERE activepieces_runtime_project_id IS NOT NULL;

COMMENT ON COLUMN activepieces_user_links.activepieces_builder_project_id IS 'Visible Activepieces project used for the user builder workspace';
COMMENT ON COLUMN activepieces_user_links.activepieces_runtime_project_id IS 'Hidden Activepieces project used only for ModelGrow marketplace runtime copies';
