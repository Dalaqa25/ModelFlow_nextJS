-- Compatibility Layer for Existing Application Code
-- This script creates views and adjustments to make the new PostgreSQL schema 
-- compatible with your existing Supabase application code

-- 1. Create a view for 'purchased_models' to match your existing code
CREATE OR REPLACE VIEW purchased_models AS
SELECT 
    mp.id,
    mp.model_id,
    mp.user_email,
    mp.purchased_at,
    mp.price,
    -- Add model details for convenience
    m.name as model_name,
    m.author_email as model_author_email,
    m.img_url as model_img_url
FROM model_purchases mp
JOIN models m ON mp.model_id = m.id;

-- 2. Create a function to handle subscription updates (convert object to enum)
CREATE OR REPLACE FUNCTION update_user_subscription_compatibility(
    user_email VARCHAR,
    subscription_data JSONB
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    email VARCHAR,
    profile_image_url TEXT,
    about_me TEXT,
    website_link TEXT,
    contact_email VARCHAR,
    total_earnings INTEGER,
    withdrawn_amount INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    is_admin BOOLEAN,
    subscription JSONB  -- Return as JSONB for compatibility
) AS $$
DECLARE
    plan_value subscription_plan;
BEGIN
    -- Extract plan from subscription object, default to 'basic'
    plan_value := COALESCE(
        (subscription_data->>'plan')::subscription_plan, 
        'basic'::subscription_plan
    );
    
    -- Update the user
    UPDATE users 
    SET subscription_plan = plan_value
    WHERE users.email = user_email;
    
    -- Return the updated user with subscription as JSONB for compatibility
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        u.profile_image_url,
        u.about_me,
        u.website_link,
        u.contact_email,
        u.total_earnings,
        u.withdrawn_amount,
        u.created_at,
        u.is_admin,
        jsonb_build_object('plan', u.subscription_plan) as subscription
    FROM users u
    WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a view for users that includes subscription as JSONB for compatibility
CREATE OR REPLACE VIEW users_with_subscription AS
SELECT 
    id,
    name,
    email,
    profile_image_url,
    about_me,
    website_link,
    contact_email,
    total_earnings,
    withdrawn_amount,
    created_at,
    is_admin,
    jsonb_build_object('plan', subscription_plan) as subscription
FROM users;

-- 4. Create insert/update functions for purchased_models view
CREATE OR REPLACE FUNCTION insert_purchased_model(
    model_id_param UUID,
    user_email_param VARCHAR,
    price_param INTEGER
)
RETURNS TABLE (
    id UUID,
    model_id UUID,
    user_email VARCHAR,
    purchased_at TIMESTAMP WITH TIME ZONE,
    price INTEGER,
    model_name VARCHAR,
    model_author_email VARCHAR,
    model_img_url TEXT
) AS $$
DECLARE
    new_purchase_id UUID;
BEGIN
    -- Insert into model_purchases
    INSERT INTO model_purchases (model_id, user_email, price)
    VALUES (model_id_param, user_email_param, price_param)
    RETURNING model_purchases.id INTO new_purchase_id;
    
    -- Also insert into user_purchased_models for the user reference
    INSERT INTO user_purchased_models (user_id, model_id, price)
    SELECT u.id, model_id_param, price_param
    FROM users u
    WHERE u.email = user_email_param;
    
    -- Return the purchase with model details
    RETURN QUERY
    SELECT * FROM purchased_models WHERE purchased_models.id = new_purchase_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Create a trigger to automatically sync model_purchases with user_purchased_models
CREATE OR REPLACE FUNCTION sync_user_purchased_models()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Add to user_purchased_models when a purchase is made
        INSERT INTO user_purchased_models (user_id, model_id, purchased_at, price)
        SELECT u.id, NEW.model_id, NEW.purchased_at, NEW.price
        FROM users u
        WHERE u.email = NEW.user_email
        ON CONFLICT (user_id, model_id) DO NOTHING;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_sync_user_purchased_models ON model_purchases;
CREATE TRIGGER trigger_sync_user_purchased_models
    AFTER INSERT ON model_purchases
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_purchased_models();

-- 6. Create instead-of triggers for the purchased_models view to handle inserts
CREATE OR REPLACE FUNCTION purchased_models_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Use our insert function
    PERFORM insert_purchased_model(NEW.model_id, NEW.user_email, NEW.price);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the instead-of trigger for the view
CREATE TRIGGER purchased_models_insert_trigger
    INSTEAD OF INSERT ON purchased_models
    FOR EACH ROW
    EXECUTE FUNCTION purchased_models_insert();

-- 7. Add missing columns to match your existing schema expectations
-- Add subscription column to users table as computed column
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_computed JSONB 
GENERATED ALWAYS AS (jsonb_build_object('plan', subscription_plan)) STORED;

-- 8. Create indexes for the new compatibility layer
CREATE INDEX IF NOT EXISTS idx_model_purchases_user_email ON model_purchases(user_email);
CREATE INDEX IF NOT EXISTS idx_model_purchases_purchased_at ON model_purchases(purchased_at DESC);

-- 9. Grant necessary permissions (adjust as needed for your setup)
-- These might not be needed in Supabase, but good to have
-- GRANT SELECT ON purchased_models TO authenticated;
-- GRANT SELECT ON users_with_subscription TO authenticated;

-- 10. Test queries to verify compatibility
-- You can run these to test that everything works:

/*
-- Test 1: Insert a user
INSERT INTO users (name, email, subscription_plan) 
VALUES ('Test User', 'test@example.com', 'professional');

-- Test 2: Insert a model
INSERT INTO models (name, author_id, author_email, setup) 
VALUES ('Test Model', 
        (SELECT id FROM users WHERE email = 'test@example.com'),
        'test@example.com',
        'Setup instructions');

-- Test 3: Insert a purchase using the view
INSERT INTO purchased_models (model_id, user_email, price)
VALUES (
    (SELECT id FROM models WHERE name = 'Test Model'),
    'test@example.com',
    999
);

-- Test 4: Query purchases (should work with your existing code)
SELECT * FROM purchased_models WHERE user_email = 'test@example.com';

-- Test 5: Query users with subscription (should work with your existing code)
SELECT * FROM users_with_subscription WHERE email = 'test@example.com';

-- Test 6: Update subscription using the compatibility function
SELECT * FROM update_user_subscription_compatibility(
    'test@example.com', 
    '{"plan": "enterprise"}'::jsonb
);
*/
