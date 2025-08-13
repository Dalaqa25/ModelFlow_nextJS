-- 🚀 Supabase-Native Database Schema for ModelFlow
-- This creates all the tables needed for your application

-- Enable Row Level Security (RLS)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE subscription_plan AS ENUM ('basic', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid');
CREATE TYPE model_status AS ENUM ('pending', 'approved', 'rejected', 'archived');
CREATE TYPE notification_type AS ENUM ('model_approval', 'model_rejection', 'comment', 'purchase', 'system');

-- Users table
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

-- Models table
CREATE TABLE models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    use_cases TEXT[],
    setup TEXT,
    features TEXT[],
    tags TEXT[],
    price INTEGER NOT NULL DEFAULT 500, -- in cents
    author_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    file_storage JSONB, -- Supabase storage info
    img_url TEXT,
    downloads INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    status model_status DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pending Models table
CREATE TABLE pending_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    use_cases TEXT[],
    setup TEXT,
    features TEXT[],
    tags TEXT[],
    price INTEGER NOT NULL DEFAULT 500,
    author_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    file_storage JSONB,
    img_url TEXT,
    status model_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Archived Models table
CREATE TABLE archived_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    use_cases TEXT[],
    setup TEXT,
    features TEXT[],
    tags TEXT[],
    price INTEGER NOT NULL DEFAULT 500,
    author_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    file_storage JSONB,
    img_url TEXT,
    downloads INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    data JSONB, -- Additional notification data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchased Models table
CREATE TABLE purchased_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    price INTEGER NOT NULL, -- Price paid in cents
    lemon_squeezy_order_id TEXT,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_email, model_id)
);

-- Requests table (Community feature)
CREATE TABLE requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    status TEXT DEFAULT 'open',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Request Comments table
CREATE TABLE request_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    author_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Earnings History table
CREATE TABLE earnings_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    model_id UUID NOT NULL,
    model_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    amount INTEGER NOT NULL, -- Amount earned in cents
    lemon_squeezy_order_id TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    release_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '5 minutes'
);

-- Withdrawals table
CREATE TABLE withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Amount in cents
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
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

-- Create RLS policies
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.jwt() ->> 'email' = email);

-- Anyone can read approved models
CREATE POLICY "Anyone can view approved models" ON models
    FOR SELECT USING (status = 'approved');

-- Authors can manage their own models
CREATE POLICY "Authors can manage own models" ON models
    FOR ALL USING (auth.jwt() ->> 'email' = author_email);

-- Authors can manage their own pending models
CREATE POLICY "Authors can manage own pending models" ON pending_models
    FOR ALL USING (auth.jwt() ->> 'email' = author_email);

-- Authors can view their own archived models
CREATE POLICY "Authors can view own archived models" ON archived_models
    FOR SELECT USING (auth.jwt() ->> 'email' = author_email);

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases" ON purchased_models
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Anyone can view requests
CREATE POLICY "Anyone can view requests" ON requests
    FOR SELECT USING (true);

-- Authors can manage their own requests
CREATE POLICY "Authors can manage own requests" ON requests
    FOR ALL USING (auth.jwt() ->> 'email' = author_email);

-- Anyone can view request comments
CREATE POLICY "Anyone can view request comments" ON request_comments
    FOR SELECT USING (true);

-- Users can create comments
CREATE POLICY "Users can create comments" ON request_comments
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = author_email);

-- Users can view their own earnings
CREATE POLICY "Users can view own earnings" ON earnings_history
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Users can create withdrawals
CREATE POLICY "Users can create withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pending_models_updated_at BEFORE UPDATE ON pending_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (email, name)
    VALUES (
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create a function to drop tables if they exist
CREATE OR REPLACE FUNCTION drop_table_if_exists(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(table_name) || ' CASCADE';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE users IS 'User profiles and subscription information';
COMMENT ON TABLE models IS 'Approved AI models available for purchase';
COMMENT ON TABLE pending_models IS 'Models waiting for admin approval';
COMMENT ON TABLE archived_models IS 'Models that have been archived';
COMMENT ON TABLE notifications IS 'User notifications and alerts';
COMMENT ON TABLE purchased_models IS 'User purchase history';
COMMENT ON TABLE requests IS 'Community feature requests';
COMMENT ON TABLE request_comments IS 'Comments on feature requests';
COMMENT ON TABLE earnings_history IS 'Model creator earnings tracking';
COMMENT ON TABLE withdrawals IS 'User withdrawal requests';
