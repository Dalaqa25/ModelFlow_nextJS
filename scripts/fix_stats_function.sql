-- Fix for the ambiguous column reference error
-- This replaces the problematic get_earnings_processing_stats function

-- Drop the old function first
DROP FUNCTION IF EXISTS get_earnings_processing_stats();

-- Create the corrected function with explicit table aliases
CREATE OR REPLACE FUNCTION get_earnings_processing_stats()
RETURNS TABLE(
    last_run TIMESTAMP WITH TIME ZONE,
    last_status TEXT,
    pending_transactions INTEGER,
    recent_errors INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT MAX(epl1.processed_at) FROM earnings_processing_log epl1) as last_run,
        (SELECT epl2.status FROM earnings_processing_log epl2 ORDER BY epl2.processed_at DESC LIMIT 1) as last_status,
        (SELECT COUNT(*)::INTEGER FROM transactions t WHERE t.processed = FALSE AND t.release_at <= NOW()) as pending_transactions,
        (SELECT COUNT(*)::INTEGER FROM earnings_processing_log epl3 WHERE epl3.status = 'error' AND epl3.processed_at > NOW() - INTERVAL '24 hours') as recent_errors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the fixed function
SELECT * FROM get_earnings_processing_stats();