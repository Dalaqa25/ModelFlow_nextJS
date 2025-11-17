-- Creates an automations catalog table to power the Automations page UI.
-- Includes columns for metadata, price, and uploaded image references.

CREATE TABLE IF NOT EXISTS automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    image_url TEXT,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    currency_code CHAR(3) NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS automations_is_active_idx
    ON automations (is_active);

CREATE INDEX IF NOT EXISTS automations_user_email_idx
    ON automations (user_email);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_automations_updated_at_trigger ON automations;

CREATE TRIGGER set_automations_updated_at_trigger
BEFORE UPDATE ON automations
FOR EACH ROW
EXECUTE FUNCTION set_automations_updated_at();