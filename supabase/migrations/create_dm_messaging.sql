-- Direct messaging (request-scoped, Reddit-style accept flow)
-- Uses public.users.id (not auth.users.id)

CREATE TABLE IF NOT EXISTS dm_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'declined')),
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_participants (
    thread_id UUID NOT NULL REFERENCES dm_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS dm_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES dm_threads(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_threads_request_id ON dm_threads(request_id);
CREATE INDEX IF NOT EXISTS idx_dm_threads_status ON dm_threads(status);
CREATE INDEX IF NOT EXISTS idx_dm_threads_updated_at ON dm_threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_participants_user_id ON dm_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_thread_id ON dm_messages(thread_id, created_at ASC);

DROP TRIGGER IF EXISTS update_dm_threads_updated_at ON dm_threads;
CREATE TRIGGER update_dm_threads_updated_at
    BEFORE UPDATE ON dm_threads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE dm_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; policies for future client-side access if needed
CREATE POLICY "Participants can view own threads"
    ON dm_threads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM dm_participants p
            WHERE p.thread_id = dm_threads.id AND p.user_id = auth.uid()
        )
    );

COMMENT ON TABLE dm_threads IS 'Private DM threads, often linked to community requests';
COMMENT ON TABLE dm_participants IS 'Users in a DM thread';
COMMENT ON TABLE dm_messages IS 'Messages within a DM thread';
