-- ============================================================================
-- EARNINGS PROCESSING TOGGLE SCRIPT
-- ============================================================================
-- Use this script to easily enable/disable earnings processing in testing
-- ============================================================================

-- ⚠️  CHOOSE ONE: Uncomment the section you want to run

-- ============================================================================
-- 🛑 DISABLE EARNINGS PROCESSING (for testing environment)
-- ============================================================================
-- Uncomment this section to disable:

-- SELECT cron.unschedule('process-earnings-5min');
-- SELECT cron.unschedule('cleanup-earnings-logs');
-- 
-- SELECT '🛑 Earnings processing DISABLED' as status;
-- SELECT 'Database stress reduced - safe for testing' as info;

-- ============================================================================
-- 🟢 ENABLE EARNINGS PROCESSING (for production/testing earnings)
-- ============================================================================
-- Uncomment this section to enable:

-- SELECT cron.schedule(
--     'process-earnings-5min',
--     '*/5 * * * *',
--     'SELECT process_released_earnings();'
-- );
-- 
-- SELECT cron.schedule(
--     'cleanup-earnings-logs',
--     '0 2 * * *',
--     'DELETE FROM earnings_processing_log WHERE processed_at < NOW() - INTERVAL ''30 days'';'
-- );
-- 
-- SELECT '🟢 Earnings processing ENABLED' as status;
-- SELECT 'Running every 5 minutes' as schedule_info;

-- ============================================================================
-- 📊 CHECK CURRENT STATUS
-- ============================================================================
-- Always run this to see current status:

SELECT 'Current Earnings Processing Status:' as info;

SELECT 
    jobname,
    schedule,
    CASE 
        WHEN active THEN '🟢 ACTIVE - Processing every 5 minutes'
        ELSE '🔴 DISABLED - No automatic processing'
    END as status,
    database
FROM cron.job 
WHERE jobname LIKE '%earnings%'
UNION ALL
SELECT 
    'No jobs found' as jobname,
    'N/A' as schedule,
    '🔴 DISABLED - No earnings processing scheduled' as status,
    'N/A' as database
WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname LIKE '%earnings%')
ORDER BY jobname;

-- ============================================================================
-- 🧪 MANUAL TESTING (when disabled)
-- ============================================================================
-- When automatic processing is disabled, you can still test manually:

-- SELECT 'Manual Testing Available:' as info;
-- SELECT 'Run this to process earnings manually: SELECT process_released_earnings();' as manual_command;
-- SELECT 'Run this to check stats: SELECT * FROM get_earnings_processing_stats();' as stats_command;