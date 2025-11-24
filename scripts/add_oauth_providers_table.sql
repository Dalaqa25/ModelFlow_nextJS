-- Create OAuth providers/integrations table
-- This table stores OAuth connections for users (Google, Facebook, GitHub, etc.)

CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'google', 'facebook', 'github', etc.
    provider_user_id TEXT NOT NULL, -- User ID from the OAuth provider
    provider_email TEXT, -- Email from the OAuth provider
    access_token TEXT, -- OAuth access token (may expire)
    refresh_token TEXT, -- OAuth refresh token (long-lived)
    expires_at TIMESTAMP WITH TIME ZONE, -- When the access token expires
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure one integration per provider per user
    UNIQUE(user_id, provider)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider ON user_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider_user_id ON user_integrations(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider_email ON user_integrations(provider_email) WHERE provider_email IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE user_integrations IS 'Stores OAuth provider connections for users (Google, Facebook, GitHub, etc.)';
COMMENT ON COLUMN user_integrations.provider IS 'OAuth provider name (e.g., "google", "facebook", "github")';
COMMENT ON COLUMN user_integrations.provider_user_id IS 'User ID from the OAuth provider';
COMMENT ON COLUMN user_integrations.provider_email IS 'Email address from the OAuth provider';
COMMENT ON COLUMN user_integrations.access_token IS 'OAuth access token (temporary, expires)';
COMMENT ON COLUMN user_integrations.refresh_token IS 'OAuth refresh token (long-lived, used to get new access tokens)';
COMMENT ON COLUMN user_integrations.expires_at IS 'Timestamp when the access token expires';