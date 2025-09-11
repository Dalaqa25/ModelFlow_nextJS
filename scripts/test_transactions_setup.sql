-- ============================================================================
-- TEST TRANSACTIONS SETUP
-- ============================================================================
-- Description: Create test transactions to verify earnings processing
-- Note: Uses valid email formats as required by system
-- ============================================================================

-- Step 1: Ensure we have test users (adjust emails as needed)
INSERT INTO users (email, name, total_earnings) 
VALUES 
    ('test.seller@gmail.com', 'Test Seller', 0),
    ('test.buyer@gmail.com', 'Test Buyer', 0)
ON CONFLICT (email) DO NOTHING;

-- Step 2: Create a test model
INSERT INTO models (name, description, price, author_email) 
VALUES 
    ('Test AI Model', 'A test model for earnings processing', 1500, 'test.seller@gmail.com')  -- $15.00
ON CONFLICT DO NOTHING;

-- Step 3: Create test transactions with different release times
-- Transaction 1: Already released (should be processed immediately)
INSERT INTO transactions (
    buyer_email,
    seller_email, 
    model_id,
    price,
    processed,
    created_at,
    release_at
) VALUES (
    'test.buyer@gmail.com',
    'test.seller@gmail.com',
    (SELECT id FROM models WHERE author_email = 'test.seller@gmail.com' LIMIT 1),
    1500,  -- $15.00
    FALSE,
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '5 minutes'  -- Released 5 minutes ago
);

-- Transaction 2: Will be released in 2 minutes
INSERT INTO transactions (
    buyer_email,
    seller_email, 
    model_id,
    price,
    processed,
    created_at,
    release_at
) VALUES (
    'test.buyer@gmail.com',
    'test.seller@gmail.com',
    (SELECT id FROM models WHERE author_email = 'test.seller@gmail.com' LIMIT 1),
    2000,  -- $20.00
    FALSE,
    NOW() - INTERVAL '3 minutes',
    NOW() + INTERVAL '2 minutes'  -- Will be released in 2 minutes
);

-- Transaction 3: Will be released in 7 minutes
INSERT INTO transactions (
    buyer_email,
    seller_email, 
    model_id,
    price,
    processed,
    created_at,
    release_at
) VALUES (
    'test.buyer@gmail.com',
    'test.seller@gmail.com',
    (SELECT id FROM models WHERE author_email = 'test.seller@gmail.com' LIMIT 1),
    500,   -- $5.00
    FALSE,
    NOW(),
    NOW() + INTERVAL '7 minutes'  -- Will be released in 7 minutes
);

-- Step 4: Verification queries
SELECT 'Test transactions created:' as info;

SELECT 
    id,
    seller_email,
    price / 100.0 as amount_dollars,
    processed,
    created_at::timestamp(0) as created,
    release_at::timestamp(0) as releases_at,
    CASE 
        WHEN release_at <= NOW() THEN 'Ready for processing'
        ELSE 'Waiting (' || EXTRACT(EPOCH FROM (release_at - NOW()))/60 || ' min)'
    END as status
FROM transactions 
WHERE seller_email = 'test.seller@gmail.com'
ORDER BY created_at DESC;

SELECT 'Current user earnings:' as info;
SELECT 
    email,
    total_earnings / 100.0 as current_earnings_dollars
FROM users 
WHERE email = 'test.seller@gmail.com';

SELECT 'Ready to test!' as status;
SELECT 'Run: SELECT process_released_earnings(); to test manually' as next_step;