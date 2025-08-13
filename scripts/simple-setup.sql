-- 🚀 Simple Database Setup for ModelFlow
-- Copy and paste this into your Supabase Dashboard SQL Editor

-- Drop existing tables if they exist
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS models CASCADE;
DROP TABLE IF EXISTS pending_models CASCADE;
DROP TABLE IF EXISTS archived_models CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS purchased_models CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS request_comments CASCADE;
DROP TABLE IF EXISTS earnings_history CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;

-- Create Users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    profile_image_url TEXT,
    about_me TEXT,
    website_link TEXT,
    contact_email TEXT,
    subscription JSONB DEFAULT '{"plan": "basic", "status": "active", "balance": 0}'::jsonb,
    total_earnings INTEGER DEFAULT 0,
    withdrawn_amount INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Models table
CREATE TABLE models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    use_cases TEXT[],
    setup TEXT,
    features TEXT[],
    tags TEXT[],
    price INTEGER NOT NULL DEFAULT 500,
    author_email TEXT NOT NULL,
    file_storage JSONB,
    img_url TEXT,
    downloads INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Pending Models table
CREATE TABLE pending_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    use_cases TEXT[],
    setup TEXT,
    features TEXT[],
    tags TEXT[],
    price INTEGER NOT NULL DEFAULT 500,
    author_email TEXT NOT NULL,
    file_storage JSONB,
    img_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Archived Models table
CREATE TABLE archived_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    use_cases TEXT[],
    setup TEXT,
    features TEXT[],
    tags TEXT[],
    price INTEGER NOT NULL DEFAULT 500,
    author_email TEXT NOT NULL,
    file_storage JSONB,
    img_url TEXT,
    downloads INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Purchased Models table
CREATE TABLE purchased_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    model_id UUID NOT NULL,
    price INTEGER NOT NULL,
    lemon_squeezy_order_id TEXT,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_email, model_id)
);

-- Create Requests table
CREATE TABLE requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author_email TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Request Comments table
CREATE TABLE request_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Earnings History table
CREATE TABLE earnings_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    model_id UUID NOT NULL,
    model_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    amount INTEGER NOT NULL,
    lemon_squeezy_order_id TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    release_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '5 minutes'
);

-- Create Withdrawals table
CREATE TABLE withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    payment_details JSONB,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_models_author ON models(author_email);
CREATE INDEX idx_models_status ON models(status);
CREATE INDEX idx_models_created_at ON models(created_at DESC);
CREATE INDEX idx_pending_models_author ON pending_models(author_email);
CREATE INDEX idx_pending_models_status ON pending_models(status);
CREATE INDEX idx_archived_models_author ON archived_models(author_email);
CREATE INDEX idx_notifications_user ON notifications(user_email);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_purchased_models_user ON purchased_models(user_email);
CREATE INDEX idx_purchased_models_model ON purchased_models(model_id);
CREATE INDEX idx_requests_author ON requests(author_email);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_earnings_history_user ON earnings_history(user_email);
CREATE INDEX idx_withdrawals_user ON withdrawals(user_email);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchased_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.jwt() ->> 'email' = email);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.jwt() ->> 'email' = email);
CREATE POLICY "Anyone can view approved models" ON models FOR SELECT USING (status = 'approved');
CREATE POLICY "Authors can manage own models" ON models FOR ALL USING (auth.jwt() ->> 'email' = author_email);
CREATE POLICY "Authors can manage own pending models" ON pending_models FOR ALL USING (auth.jwt() ->> 'email' = author_email);
CREATE POLICY "Authors can view own archived models" ON archived_models FOR SELECT USING (auth.jwt() ->> 'email' = author_email);
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can view own purchases" ON purchased_models FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Anyone can view requests" ON requests FOR SELECT USING (true);
CREATE POLICY "Authors can manage own requests" ON requests FOR ALL USING (auth.jwt() ->> 'email' = author_email);
CREATE POLICY "Anyone can view request comments" ON request_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON request_comments FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = author_email);
CREATE POLICY "Users can view own earnings" ON earnings_history FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can create withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'Database setup completed successfully!' as status;
