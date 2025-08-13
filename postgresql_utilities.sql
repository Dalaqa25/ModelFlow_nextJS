-- PostgreSQL Utility Functions and Example Queries
-- This file contains helpful functions and example queries for your migrated database

-- Function to get user's purchased models (similar to MongoDB populate)
CREATE OR REPLACE FUNCTION get_user_purchased_models(user_email_param VARCHAR)
RETURNS TABLE (
    model_id UUID,
    model_name VARCHAR,
    purchased_at TIMESTAMP WITH TIME ZONE,
    price INTEGER,
    author_email VARCHAR,
    file_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        mp.purchased_at,
        mp.price,
        m.author_email,
        mfs.url
    FROM model_purchases mp
    JOIN models m ON mp.model_id = m.id
    LEFT JOIN model_file_storage mfs ON m.id = mfs.model_id
    WHERE mp.user_email = user_email_param
    ORDER BY mp.purchased_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's earnings summary
CREATE OR REPLACE FUNCTION get_user_earnings_summary(user_id_param UUID)
RETURNS TABLE (
    total_earnings INTEGER,
    withdrawn_amount INTEGER,
    available_balance INTEGER,
    total_sales INTEGER,
    recent_earnings JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.total_earnings,
        u.withdrawn_amount,
        (u.total_earnings - u.withdrawn_amount) as available_balance,
        (SELECT COUNT(*)::INTEGER FROM earnings_history WHERE user_id = user_id_param) as total_sales,
        (SELECT COALESCE(json_agg(
            json_build_object(
                'model_name', model_name,
                'amount', amount,
                'buyer_email', buyer_email,
                'earned_at', earned_at
            ) ORDER BY earned_at DESC
        ), '[]'::json)::jsonb
        FROM earnings_history 
        WHERE user_id = user_id_param 
        LIMIT 10) as recent_earnings
    FROM users u
    WHERE u.id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get model statistics
CREATE OR REPLACE FUNCTION get_model_stats(model_id_param UUID)
RETURNS TABLE (
    model_name VARCHAR,
    total_purchases INTEGER,
    total_revenue INTEGER,
    total_likes INTEGER,
    total_downloads INTEGER,
    purchase_history JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.name,
        (SELECT COUNT(*)::INTEGER FROM model_purchases WHERE model_id = model_id_param),
        (SELECT COALESCE(SUM(price), 0)::INTEGER FROM model_purchases WHERE model_id = model_id_param),
        m.likes,
        m.downloads,
        (SELECT COALESCE(json_agg(
            json_build_object(
                'user_email', user_email,
                'purchased_at', purchased_at,
                'price', price
            ) ORDER BY purchased_at DESC
        ), '[]'::json)::jsonb
        FROM model_purchases 
        WHERE model_id = model_id_param) as purchase_history
    FROM models m
    WHERE m.id = model_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to search models by tags (similar to MongoDB array queries)
CREATE OR REPLACE FUNCTION search_models_by_tags(search_tags TEXT[])
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    author_email VARCHAR,
    tags TEXT[],
    price INTEGER,
    likes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.author_email,
        m.tags,
        m.price,
        m.likes,
        m.created_at
    FROM models m
    WHERE m.tags && search_tags  -- PostgreSQL array overlap operator
    AND m.archived = FALSE
    ORDER BY m.likes DESC, m.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Example queries for common operations

-- 1. Get all models with their file storage info
/*
SELECT * FROM models_with_storage 
WHERE archived = FALSE 
ORDER BY created_at DESC;
*/

-- 2. Get requests with comment counts
/*
SELECT * FROM requests_with_comment_count 
ORDER BY created_at DESC;
*/

-- 3. Get user's purchased models
/*
SELECT * FROM get_user_purchased_models('user@example.com');
*/

-- 4. Get user's earnings summary
/*
SELECT * FROM get_user_earnings_summary('user-uuid-here');
*/

-- 5. Search models by tags
/*
SELECT * FROM search_models_by_tags(ARRAY['ai', 'machine-learning']);
*/

-- 6. Get top selling models
/*
SELECT 
    m.name,
    m.author_email,
    COUNT(mp.id) as purchase_count,
    SUM(mp.price) as total_revenue
FROM models m
LEFT JOIN model_purchases mp ON m.id = mp.model_id
WHERE m.archived = FALSE
GROUP BY m.id, m.name, m.author_email
ORDER BY purchase_count DESC, total_revenue DESC
LIMIT 10;
*/

-- 7. Get user's notification count
/*
SELECT 
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE read = FALSE) as unread_notifications
FROM notifications 
WHERE user_email = 'user@example.com';
*/

-- 8. Get pending models for admin review
/*
SELECT 
    pm.*,
    pmfs.file_name,
    pmfs.file_size
FROM pending_models pm
LEFT JOIN pending_model_file_storage pmfs ON pm.id = pmfs.pending_model_id
WHERE pm.status = 'pending'
ORDER BY pm.created_at ASC;
*/

-- 9. Get models that need to be archived (example: no purchases in 6 months)
/*
SELECT m.*
FROM models m
LEFT JOIN model_purchases mp ON m.id = mp.model_id
WHERE m.archived = FALSE
GROUP BY m.id
HAVING MAX(mp.purchased_at) < CURRENT_TIMESTAMP - INTERVAL '6 months'
   OR MAX(mp.purchased_at) IS NULL;
*/

-- 10. Get user's withdrawal history
/*
SELECT 
    wr.*,
    u.name as user_name
FROM withdrawal_requests wr
JOIN users u ON wr.user_id = u.id
WHERE wr.user_id = 'user-uuid-here'
ORDER BY wr.submitted_at DESC;
*/
