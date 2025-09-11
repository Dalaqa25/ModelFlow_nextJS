-- ============================================================================
-- FRESH OPTIMIZED EARNINGS PROCESSING SETUP
-- ============================================================================
-- Date: 2025-09-11
-- Description: Clean implementation of automated earnings processing
-- Schedule: Every 5 minutes (Golden Spot for performance vs responsiveness)
-- ============================================================================

-- Step 1: Ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Create the logging table for monitoring
CREATE TABLE IF NOT EXISTS earnings_processing_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    log_details TEXT,
    transactions_count INTEGER DEFAULT 0,
    total_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'success'
);

-- Create index for efficient log querying
CREATE INDEX IF NOT EXISTS idx_earnings_log_date ON earnings_processing_log(processed_at);
CREATE INDEX IF NOT EXISTS idx_earnings_log_status ON earnings_processing_log(status);

-- Step 3: Create the optimized earnings processing function
CREATE OR REPLACE FUNCTION process_released_earnings()
RETURNS TEXT AS $$
DECLARE
    pending_count INTEGER := 0;
    processed_users INTEGER := 0;
    total_amount INTEGER := 0;
    current_user_email TEXT;
    user_earnings INTEGER;
    user_transaction_count INTEGER;
    processing_log TEXT := '';
    start_time TIMESTAMP;
BEGIN
    start_time := NOW();
    
    -- OPTIMIZATION 1: Quick early exit check
    -- This prevents unnecessary work 95% of the time
    SELECT COUNT(*) INTO pending_count
    FROM transactions 
    WHERE processed = FALSE 
    AND release_at <= NOW();
    
    -- Early exit if no work to do (saves resources)
    IF pending_count = 0 THEN
        RETURN 'No transactions ready for processing at ' || start_time;
    END IF;
    
    -- OPTIMIZATION 2: Only proceed if there's actual work
    BEGIN
        processing_log := 'Starting earnings processing at ' || start_time || 
                         ' (' || pending_count || ' transactions ready)' || E'\n';
        
        -- OPTIMIZATION 3: Process by user to minimize database operations
        FOR current_user_email IN
            SELECT DISTINCT seller_email 
            FROM transactions 
            WHERE processed = FALSE 
            AND release_at <= NOW()
            ORDER BY seller_email  -- Consistent processing order
        LOOP
            -- Calculate earnings for this user
            SELECT 
                COALESCE(SUM(price), 0),
                COUNT(*)
            INTO user_earnings, user_transaction_count
            FROM transactions 
            WHERE seller_email = current_user_email 
            AND processed = FALSE 
            AND release_at <= NOW();
            
            -- Only process if there are actual earnings
            IF user_earnings > 0 THEN
                -- ATOMIC OPERATION: Update user earnings
                UPDATE users 
                SET total_earnings = total_earnings + user_earnings
                WHERE email = current_user_email;
                
                -- ATOMIC OPERATION: Mark transactions as processed
                UPDATE transactions 
                SET processed = TRUE 
                WHERE seller_email = current_user_email 
                AND processed = FALSE 
                AND release_at <= NOW();
                
                -- Update counters
                processed_users := processed_users + 1;
                total_amount := total_amount + user_earnings;
                
                -- Log this user's processing
                processing_log := processing_log || 
                    'User: ' || current_user_email || 
                    ' | Transactions: ' || user_transaction_count ||
                    ' | Amount: $' || (user_earnings::DECIMAL / 100) || E'\n';
            END IF;
        END LOOP;
        
        -- Final summary
        processing_log := processing_log || 
            'Completed at ' || NOW() || 
            ' | Duration: ' || (EXTRACT(EPOCH FROM (NOW() - start_time)) || 's') ||
            ' | Users: ' || processed_users ||
            ' | Total: $' || (total_amount::DECIMAL / 100);
        
        -- OPTIMIZATION 4: Only log when actual processing occurs
        IF total_amount > 0 THEN
            INSERT INTO earnings_processing_log (
                processed_at, 
                log_details, 
                transactions_count, 
                total_amount, 
                status
            ) VALUES (
                start_time, 
                processing_log, 
                pending_count, 
                total_amount, 
                'success'
            );
        END IF;
        
        RETURN processing_log;
        
    EXCEPTION WHEN OTHERS THEN
        -- Comprehensive error handling
        processing_log := processing_log || E'\nERROR: ' || SQLERRM;
        
        -- Always log errors for debugging
        INSERT INTO earnings_processing_log (
            processed_at, 
            log_details, 
            transactions_count, 
            total_amount, 
            status
        ) VALUES (
            start_time, 
            processing_log, 
            pending_count, 
            total_amount, 
            'error'
        );
        
        -- Notify about the error
        RAISE NOTICE 'Earnings processing failed: %', SQLERRM;
        RETURN 'ERROR: ' || SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create helper function for monitoring
CREATE OR REPLACE FUNCTION get_earnings_processing_stats()
RETURNS TABLE(
    last_run TIMESTAMP WITH TIME ZONE,
    status TEXT,
    pending_transactions INTEGER,
    recent_errors INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT MAX(processed_at) FROM earnings_processing_log) as last_run,
        (SELECT status FROM earnings_processing_log ORDER BY processed_at DESC LIMIT 1) as status,
        (SELECT COUNT(*)::INTEGER FROM transactions WHERE processed = FALSE AND release_at <= NOW()) as pending_transactions,
        (SELECT COUNT(*)::INTEGER FROM earnings_processing_log WHERE status = 'error' AND processed_at > NOW() - INTERVAL '24 hours') as recent_errors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Schedule the cron job (Every 5 minutes - Golden Spot!)
SELECT cron.schedule(
    'process-earnings-5min',
    '*/5 * * * *',                    -- Every 5 minutes
    'SELECT process_released_earnings();'
);

-- Step 6: Schedule cleanup job (Daily log cleanup)
SELECT cron.schedule(
    'cleanup-earnings-logs',
    '0 2 * * *',                      -- Daily at 2 AM
    'DELETE FROM earnings_processing_log WHERE processed_at < NOW() - INTERVAL ''30 days'';'
);

-- Step 7: Verification and monitoring queries
SELECT 'Setup completed successfully!' as status;

SELECT 'Scheduled Jobs:' as info;
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    database
FROM cron.job 
WHERE jobname LIKE '%earnings%'
ORDER BY jobname;

SELECT 'Next Processing Check:' as info;
SELECT 'Function will run within 5 minutes and check for transactions ready for processing' as next_run;

-- Uncomment to test the function manually:
-- SELECT process_released_earnings();

-- Uncomment to check processing stats:
-- SELECT * FROM get_earnings_processing_stats();