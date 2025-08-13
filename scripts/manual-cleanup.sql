-- 🧹 Manual Database Cleanup Script
-- Copy and paste this into your Supabase Dashboard SQL Editor

-- Drop all existing tables (Prisma-created)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS models CASCADE;
DROP TABLE IF EXISTS "pendingModels" CASCADE;
DROP TABLE IF EXISTS "archivedModels" CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS "purchasedModels" CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS "earningsHistory" CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

-- Drop any other tables that might exist
DROP TABLE IF EXISTS "request_comments" CASCADE;
DROP TABLE IF EXISTS "user_profiles" CASCADE;
DROP TABLE IF EXISTS "model_likes" CASCADE;
DROP TABLE IF EXISTS "model_downloads" CASCADE;

-- Drop any custom types that might exist
DROP TYPE IF EXISTS subscription_plan CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS model_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Verify cleanup
SELECT 'Database cleanup completed!' as status;
