# 🚀 Supabase Database Setup Guide

## 🎯 **Overview**

This guide will help you replace your Prisma-created database with a clean, Supabase-native database structure. This is the best approach since your current database was created by Prisma and may have compatibility issues.

## 📋 **Prerequisites**

1. **Supabase Project** - Make sure you have access to your Supabase project
2. **Environment Variables** - Ensure these are set in your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## 🗑️ **Step 1: Backup Important Data (Optional)**

If you have important data you want to keep:

1. **Export your current data** from Supabase Dashboard
2. **Download any important files** from Supabase Storage
3. **Note down any important user information**

## 🧹 **Step 2: Clean Up Current Database**

### **Option A: Using Supabase Dashboard (Recommended)**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run this cleanup script:**

```sql
-- Drop all existing tables
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
```

### **Option B: Using the Cleanup Script**

```bash
# Run the cleanup script
node scripts/cleanup-database.js
```

## 🏗️ **Step 3: Create New Database Schema**

### **Option A: Using Supabase Dashboard (Recommended)**

1. **Go to SQL Editor in Supabase Dashboard**
2. **Copy the entire content** from `scripts/create-supabase-tables.sql`
3. **Paste and execute** the SQL script
4. **Verify all tables were created**

### **Option B: Using the Setup Script**

```bash
# Run the complete setup script
node scripts/setup-database.js
```

## ✅ **Step 4: Verify Setup**

After creating the new schema, verify that:

1. **All tables exist** in the Supabase Dashboard
2. **Row Level Security (RLS)** is enabled on all tables
3. **Policies are created** for proper access control
4. **Indexes are created** for performance

## 🧪 **Step 5: Test the Setup**

### **Test User Creation**
1. **Sign up a new user** in your application
2. **Check if the user appears** in the `users` table
3. **Verify the trigger** created the user automatically

### **Test Basic Operations**
1. **Create a test model** (if you have the upload feature)
2. **Check if notifications work**
3. **Verify authentication** still works

## 🔧 **Step 6: Update Your Application**

Your application should already be updated to use the new Supabase database client. The main changes are:

- ✅ **Removed Prisma dependencies**
- ✅ **Updated API routes** to use Supabase
- ✅ **Created new database client** (`lib/db/supabase-db.js`)

## 📊 **New Database Structure**

### **Tables Created:**

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User profiles and subscriptions | JSONB subscription data, automatic creation |
| `models` | Approved AI models | Array fields for tags/features, file storage |
| `pending_models` | Models awaiting approval | Same structure as models |
| `archived_models` | Archived models | Preserves all data |
| `notifications` | User notifications | Type system, read status |
| `purchased_models` | Purchase history | Unique constraints |
| `requests` | Community feature requests | Status tracking |
| `request_comments` | Comments on requests | Linked to requests |
| `earnings_history` | Creator earnings | Automatic release timing |
| `withdrawals` | Withdrawal requests | Status tracking |

### **Key Features:**

- 🔒 **Row Level Security (RLS)** enabled on all tables
- 🚀 **Automatic timestamps** with triggers
- 📊 **Performance indexes** on key columns
- 🔄 **Automatic user creation** when signing up
- 💾 **JSONB fields** for flexible data storage
- 🎯 **Proper foreign key relationships**

## 🚨 **Important Notes**

### **Data Migration:**
- **User data** will be recreated when users sign in
- **Models and other data** will need to be recreated
- **File storage** remains intact in Supabase Storage

### **Authentication:**
- **Supabase Auth** continues to work as before
- **User profiles** are automatically created on signup
- **No changes needed** to authentication flow

### **Performance:**
- **Better query performance** with proper indexes
- **Automatic connection management**
- **No more connection issues**

## 🎉 **Benefits of New Setup**

### **Reliability:**
- ✅ No more Prisma connection issues
- ✅ Automatic connection management
- ✅ Better error handling
- ✅ Built-in retry logic

### **Performance:**
- ✅ Faster queries with proper indexes
- ✅ Better connection pooling
- ✅ Reduced memory usage
- ✅ Optimized for web applications

### **Features:**
- ✅ Real-time subscriptions ready
- ✅ Row Level Security built-in
- ✅ Automatic backups
- ✅ Better scalability

### **Maintenance:**
- ✅ Simpler codebase
- ✅ Fewer dependencies
- ✅ Easier debugging
- ✅ Better documentation

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **"Table doesn't exist" errors**
   - Make sure you ran the SQL script completely
   - Check if all tables were created in Supabase Dashboard

2. **Permission errors**
   - Verify RLS policies are created
   - Check if service role key is correct

3. **User creation issues**
   - Verify the trigger function was created
   - Check if the function has proper permissions

### **Getting Help:**

1. **Check Supabase logs** in the Dashboard
2. **Verify environment variables** are correct
3. **Test with a simple query** in SQL Editor
4. **Check the migration documentation** for details

## 🎯 **Next Steps**

After completing the setup:

1. **Test all application features**
2. **Create some sample data**
3. **Verify notifications work**
4. **Test model upload/download**
5. **Check user authentication**
6. **Verify purchase flow**

## 📞 **Support**

If you encounter any issues:

1. **Check the Supabase Dashboard** for error logs
2. **Verify your environment variables**
3. **Test individual API endpoints**
4. **Check the migration documentation**

---

**🎉 Congratulations!** Your application now has a clean, reliable, and performant Supabase-native database structure!
