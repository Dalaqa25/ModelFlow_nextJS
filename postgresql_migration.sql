-- PostgreSQL Database Migration from MongoDB
-- This script creates all tables with proper relationships and constraints

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE subscription_plan AS ENUM ('basic', 'professional', 'enterprise');
CREATE TYPE file_storage_type AS ENUM ('zip', 'drive');
CREATE TYPE model_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM ('model_rejection', 'model_approval', 'comment', 'purchase');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    profile_image_url TEXT,
    about_me TEXT,
    website_link TEXT,
    contact_email VARCHAR(255),
    total_earnings INTEGER DEFAULT 0, -- in cents
    withdrawn_amount INTEGER DEFAULT 0, -- in cents
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE,
    subscription_plan subscription_plan DEFAULT 'basic'
);

-- Models table
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_email VARCHAR(255),
    tags TEXT[], -- PostgreSQL array for tags
    description TEXT,
    features TEXT,
    use_cases TEXT,
    setup TEXT NOT NULL,
    img_url TEXT,
    price INTEGER DEFAULT 0, -- in cents
    likes INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived BOOLEAN DEFAULT FALSE
);

-- File storage information for models (normalized)
CREATE TABLE model_file_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    storage_type file_storage_type NOT NULL,
    url TEXT,
    file_name VARCHAR(255),
    file_size BIGINT, -- in bytes
    mime_type VARCHAR(100),
    folder_path TEXT,
    supabase_path TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Model likes (many-to-many relationship)
CREATE TABLE model_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    liked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_id, user_email)
);

-- Model purchases (many-to-many relationship)
CREATE TABLE model_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    price INTEGER NOT NULL, -- in cents
    UNIQUE(model_id, user_email)
);

-- User purchased models (for user reference)
CREATE TABLE user_purchased_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    price INTEGER NOT NULL, -- in cents
    UNIQUE(user_id, model_id)
);

-- Earnings history
CREATE TABLE earnings_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    model_name VARCHAR(255),
    buyer_email VARCHAR(255),
    amount INTEGER NOT NULL, -- in cents
    lemon_squeezy_order_id VARCHAR(255),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    release_at TIMESTAMP WITH TIME ZONE
);

-- Requests table
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[], -- PostgreSQL array for tags
    author_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '14 days')
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    author_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '14 days')
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    notification_type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    related_model_id UUID REFERENCES models(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pending models table
CREATE TABLE pending_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_email VARCHAR(255),
    tags TEXT[],
    description TEXT,
    features TEXT,
    use_cases TEXT,
    setup TEXT NOT NULL,
    img_url TEXT,
    ai_analysis TEXT,
    validation_status JSONB, -- JSON for complex validation object
    price INTEGER DEFAULT 0,
    status model_status DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pending model file storage
CREATE TABLE pending_model_file_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pending_model_id UUID NOT NULL REFERENCES pending_models(id) ON DELETE CASCADE,
    storage_type file_storage_type NOT NULL,
    url TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    folder_path TEXT,
    supabase_path TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Withdrawal requests table
CREATE TABLE withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paypal_email VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL, -- in cents
    status withdrawal_status DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_reason TEXT
);

-- Archived models table
CREATE TABLE archived_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    purchased_by TEXT[], -- Array of emails
    scheduled_deletion_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Archived model file storage
CREATE TABLE archived_model_file_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    archived_model_id UUID NOT NULL REFERENCES archived_models(id) ON DELETE CASCADE,
    storage_type file_storage_type NOT NULL,
    url TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    folder_path TEXT,
    supabase_path TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_models_author_id ON models(author_id);
CREATE INDEX idx_models_created_at ON models(created_at DESC);
CREATE INDEX idx_models_archived ON models(archived);
CREATE INDEX idx_models_tags ON models USING GIN(tags);

CREATE INDEX idx_model_file_storage_model_id ON model_file_storage(model_id);
CREATE INDEX idx_model_likes_model_id ON model_likes(model_id);
CREATE INDEX idx_model_likes_user_email ON model_likes(user_email);
CREATE INDEX idx_model_purchases_model_id ON model_purchases(model_id);
CREATE INDEX idx_model_purchases_user_email ON model_purchases(user_email);

CREATE INDEX idx_user_purchased_models_user_id ON user_purchased_models(user_id);
CREATE INDEX idx_user_purchased_models_model_id ON user_purchased_models(model_id);

CREATE INDEX idx_earnings_history_user_id ON earnings_history(user_id);
CREATE INDEX idx_earnings_history_model_id ON earnings_history(model_id);
CREATE INDEX idx_earnings_history_earned_at ON earnings_history(earned_at DESC);

CREATE INDEX idx_requests_author_email ON requests(author_email);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX idx_requests_expires_at ON requests(expires_at);
CREATE INDEX idx_requests_tags ON requests USING GIN(tags);

CREATE INDEX idx_comments_request_id ON comments(request_id);
CREATE INDEX idx_comments_author_email ON comments(author_email);
CREATE INDEX idx_comments_expires_at ON comments(expires_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_pending_models_author_id ON pending_models(author_id);
CREATE INDEX idx_pending_models_status ON pending_models(status);
CREATE INDEX idx_pending_models_created_at ON pending_models(created_at DESC);

CREATE INDEX idx_pending_model_file_storage_pending_model_id ON pending_model_file_storage(pending_model_id);

CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_submitted_at ON withdrawal_requests(submitted_at DESC);

CREATE INDEX idx_archived_models_author_email ON archived_models(author_email);
CREATE INDEX idx_archived_models_scheduled_deletion ON archived_models(scheduled_deletion_date);

CREATE INDEX idx_archived_model_file_storage_archived_model_id ON archived_model_file_storage(archived_model_id);

-- Create functions and triggers for automatic cleanup
-- Function to delete expired requests
CREATE OR REPLACE FUNCTION delete_expired_requests()
RETURNS void AS $$
BEGIN
    DELETE FROM requests WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to delete expired comments
CREATE OR REPLACE FUNCTION delete_expired_comments()
RETURNS void AS $$
BEGIN
    DELETE FROM comments WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to update user total earnings when earnings_history is inserted
CREATE OR REPLACE FUNCTION update_user_earnings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET total_earnings = (
        SELECT COALESCE(SUM(amount), 0)
        FROM earnings_history
        WHERE user_id = NEW.user_id
    )
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user earnings
CREATE TRIGGER trigger_update_user_earnings
    AFTER INSERT ON earnings_history
    FOR EACH ROW
    EXECUTE FUNCTION update_user_earnings();

-- Function to validate user email exists before inserting comments
CREATE OR REPLACE FUNCTION validate_user_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = NEW.author_email) THEN
        RAISE EXCEPTION 'Author email does not exist: %', NEW.author_email;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate user email for comments
CREATE TRIGGER trigger_validate_comment_author
    BEFORE INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_email();

-- Trigger to validate user email for requests
CREATE TRIGGER trigger_validate_request_author
    BEFORE INSERT ON requests
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_email();

-- Create a view for models with their file storage (similar to MongoDB populate)
CREATE VIEW models_with_storage AS
SELECT
    m.*,
    mfs.storage_type,
    mfs.url as file_url,
    mfs.file_name,
    mfs.file_size,
    mfs.mime_type,
    mfs.folder_path,
    mfs.supabase_path,
    mfs.uploaded_at as file_uploaded_at
FROM models m
LEFT JOIN model_file_storage mfs ON m.id = mfs.model_id;

-- Create a view for requests with comment count (similar to MongoDB virtual)
CREATE VIEW requests_with_comment_count AS
SELECT
    r.*,
    COALESCE(c.comment_count, 0) as comments_count
FROM requests r
LEFT JOIN (
    SELECT request_id, COUNT(*) as comment_count
    FROM comments
    GROUP BY request_id
) c ON r.id = c.request_id;
