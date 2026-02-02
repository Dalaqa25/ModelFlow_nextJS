-- Migration: Add Smart OAuth Support
-- Description: Adds required_scopes to automations and granted_scopes to user_automations
-- Date: 2026-02-03

-- 1. Add required_scopes column to automations table
ALTER TABLE automations 
ADD COLUMN IF NOT EXISTS required_scopes JSONB DEFAULT '[]'::jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_automations_required_scopes 
ON automations USING GIN (required_scopes);

-- Add comment
COMMENT ON COLUMN automations.required_scopes IS 'Array of required Google services (e.g., ["DRIVE", "SHEETS", "GMAIL"])';

-- 2. Add granted_scopes column to user_automations table
ALTER TABLE user_automations
ADD COLUMN IF NOT EXISTS granted_scopes JSONB DEFAULT '[]'::jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_automations_granted_scopes 
ON user_automations USING GIN (granted_scopes);

-- Add comment
COMMENT ON COLUMN user_automations.granted_scopes IS 'Array of granted Google OAuth scope URLs for this automation';

-- 3. Migration complete
SELECT 'Smart OAuth migration completed successfully!' AS status;
