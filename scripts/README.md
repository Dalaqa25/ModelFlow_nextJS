# Scripts Directory

This directory contains essential SQL scripts for the ModelFlow database and earnings processing system.

## 📁 **Current Scripts:**

### **🏗️ Database Schema**
- **[new.sql](./new.sql)** - Complete database schema with all tables, indexes, and policies
  - Contains the main database structure
  - Includes the `processed` column for transactions
  - **Status**: Production schema

### **⚡ Earnings Processing System**
- **[fresh_optimized_setup.sql](./fresh_optimized_setup.sql)** - Complete earnings processing setup
  - Creates optimized `process_released_earnings()` function
  - Sets up 5-minute pg_cron schedule (optimal frequency)
  - Includes logging table and monitoring functions
  - **Status**: Current production setup

### **🔄 Migration Scripts**
- **[add_processed_column_migration.sql](./add_processed_column_migration.sql)** - Adds `processed` column to transactions
  - Historical record of schema change
  - Creates necessary indexes for performance
  - **Status**: Applied migration (keep for reference)

### **🔧 Bug Fixes**
- **[fix_stats_function.sql](./fix_stats_function.sql)** - Fixes ambiguous column reference in stats function
  - Resolves PostgreSQL column naming conflict
  - **Status**: Applied fix (keep for reference)

### **🧪 Testing & Development**
- **[test_transactions_setup.sql](./test_transactions_setup.sql)** - Creates test data for earnings processing
  - Sets up test users, models, and transactions
  - Useful for development and debugging
  - **Status**: Development tool

### **❤️ Feature Scripts**
- **[add_model_likes_table.sql](./add_model_likes_table.sql)** - Model likes functionality
  - Unrelated to earnings processing
  - **Status**: Feature-specific

---

## 🚀 **Quick Setup Guide:**

For a fresh database setup, run in this order:
1. `new.sql` - Base schema
2. `fresh_optimized_setup.sql` - Earnings processing system
3. `test_transactions_setup.sql` - (Optional) Test data

## 📊 **Monitoring:**

Check system health with:
```sql
SELECT * FROM get_earnings_processing_stats();
```

---

**Last Updated**: 2025-09-11  
**Earnings Processing**: Every 5 minutes via pg_cron