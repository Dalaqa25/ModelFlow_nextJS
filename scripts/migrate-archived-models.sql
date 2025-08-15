-- Migration script to restructure archived_models table
-- This script will:
-- 1. Add only the essential columns we need
-- 2. Migrate supabase_path from archived_model_file_storage
-- 3. Drop unnecessary columns and tables

-- Step 1: Add essential columns to archived_models table
ALTER TABLE archived_models
ADD COLUMN IF NOT EXISTS supabase_path TEXT,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS deletion_date TIMESTAMP WITH TIME ZONE;

-- Step 2: Migrate supabase_path from archived_model_file_storage table
UPDATE archived_models
SET supabase_path = (
    SELECT afs.supabase_path
    FROM archived_model_file_storage afs
    WHERE afs.archived_model_id = archived_models.id
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM archived_model_file_storage afs
    WHERE afs.archived_model_id = archived_models.id
);

-- Step 3: Drop unnecessary columns (uncomment when ready)
-- ALTER TABLE archived_models
-- DROP COLUMN IF EXISTS purchased_by,
-- DROP COLUMN IF EXISTS scheduled_deletion_date;

-- Step 4: Drop the separate file storage table (uncomment when ready)
-- DROP TABLE IF EXISTS archived_model_file_storage;

-- Step 5: Set archived_at for existing records
UPDATE archived_models
SET archived_at = COALESCE(archived_at, NOW())
WHERE archived_at IS NULL;
