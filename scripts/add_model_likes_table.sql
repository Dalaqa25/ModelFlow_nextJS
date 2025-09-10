-- Add model_likes table to track individual user likes on models
-- This allows us to prevent duplicate likes and show accurate like state

CREATE TABLE IF NOT EXISTS model_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(model_id, user_email) -- Prevents duplicate likes from same user
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_model_likes_model_id ON model_likes(model_id);
CREATE INDEX IF NOT EXISTS idx_model_likes_user_email ON model_likes(user_email);
CREATE INDEX IF NOT EXISTS idx_model_likes_composite ON model_likes(model_id, user_email);

-- Add RLS policy
ALTER TABLE model_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own likes" ON model_likes FOR ALL USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Anyone can view likes" ON model_likes FOR SELECT USING (true);
