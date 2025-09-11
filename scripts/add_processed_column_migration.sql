-- Migration: Add processed column to transactions table
-- Date: 2025-09-11
-- Description: Add a boolean column to track which transactions have been processed for earnings

-- Add processed column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE;

-- Create index on processed column for efficient querying
CREATE INDEX IF NOT EXISTS idx_transactions_processed ON transactions(processed);

-- Create composite index for the pg_cron query optimization
CREATE INDEX IF NOT EXISTS idx_transactions_release_processed ON transactions(release_at, processed) 
WHERE processed = FALSE;

-- Update existing transactions to be unprocessed (since this is a new column)
-- This ensures existing transactions will be picked up by the cron job
UPDATE transactions 
SET processed = FALSE 
WHERE processed IS NULL;

-- Add comment to the column for documentation
COMMENT ON COLUMN transactions.processed IS 'Indicates whether this transaction has been processed for earnings calculation';