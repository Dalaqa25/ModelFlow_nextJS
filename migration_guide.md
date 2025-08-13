# MongoDB to PostgreSQL Migration Guide

## Overview
This guide explains how your MongoDB schemas have been converted to PostgreSQL tables and the key differences you need to understand.

## Key Changes from MongoDB to PostgreSQL

### 1. Data Types
- **ObjectId** → **UUID**: All MongoDB ObjectIds are now UUIDs
- **Arrays** → **PostgreSQL Arrays**: Tags and other arrays use native PostgreSQL array types
- **Embedded Objects** → **Separate Tables**: File storage info moved to separate tables
- **Mixed Types** → **JSONB**: Complex objects like `validationStatus` use JSONB

### 2. Relationships
- **References** → **Foreign Keys**: All MongoDB refs are now proper foreign key constraints
- **Embedded Arrays** → **Junction Tables**: purchasedModels, likedBy arrays became separate tables
- **Virtual Populates** → **Views/Functions**: Created views and functions for complex queries

### 3. Schema Structure Changes

#### Users Table
```sql
-- MongoDB: purchasedModels array embedded in user
-- PostgreSQL: Separate user_purchased_models table

-- MongoDB: earningsHistory array embedded in user  
-- PostgreSQL: Separate earnings_history table
```

#### Models Table
```sql
-- MongoDB: fileStorage embedded object
-- PostgreSQL: Separate model_file_storage table

-- MongoDB: likedBy array of emails
-- PostgreSQL: Separate model_likes table

-- MongoDB: purchasedBy array of emails  
-- PostgreSQL: Separate model_purchases table
```

#### Comments & Requests
```sql
-- MongoDB: TTL index for auto-expiration
-- PostgreSQL: expires_at column + cleanup functions
```

## Connection Setup

### Environment Variables
```env
# Replace your MongoDB connection with PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/your_database"
```

### Connection Code (if using Prisma)
```javascript
// Replace mongoose with Prisma client
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```

### Connection Code (if using pg)
```javascript
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
```

## Query Examples

### MongoDB vs PostgreSQL Queries

#### Get User with Purchased Models
```javascript
// MongoDB
const user = await User.findOne({ email }).populate('purchasedModels.modelId')

// PostgreSQL (using function)
const result = await pool.query(
  'SELECT * FROM get_user_purchased_models($1)', 
  [email]
)
```

#### Search by Tags
```javascript
// MongoDB
const models = await Model.find({ tags: { $in: ['ai', 'ml'] } })

// PostgreSQL
const models = await pool.query(
  'SELECT * FROM search_models_by_tags($1)', 
  [['ai', 'ml']]
)
```

#### Get Models with File Storage
```javascript
// MongoDB
const models = await Model.find().populate('fileStorage')

// PostgreSQL (using view)
const models = await pool.query('SELECT * FROM models_with_storage')
```

## Migration Steps

### 1. Run the Migration Script
```bash
psql -d your_database -f postgresql_migration.sql
```

### 2. Run the Utilities Script
```bash
psql -d your_database -f postgresql_utilities.sql
```

### 3. Update Your Application Code
- Replace Mongoose models with PostgreSQL queries
- Update connection logic
- Modify query syntax
- Handle array operations differently

### 4. Data Migration (if you have existing data)
You'll need to export your MongoDB data and import it into PostgreSQL:

```javascript
// Example data migration script
const mongoData = await User.find()
for (const user of mongoData) {
  await pool.query(
    'INSERT INTO users (id, name, email, ...) VALUES ($1, $2, $3, ...)',
    [user._id.toString(), user.name, user.email, ...]
  )
}
```

## Important Notes

### 1. Array Operations
```sql
-- Check if array contains value
WHERE tags @> ARRAY['ai']

-- Array overlap (any common elements)
WHERE tags && ARRAY['ai', 'ml']

-- Array length
WHERE array_length(tags, 1) > 2
```

### 2. JSON Operations
```sql
-- Query JSONB fields
WHERE validation_status->>'isValid' = 'true'

-- Update JSONB fields
UPDATE pending_models 
SET validation_status = validation_status || '{"message": "Updated"}'
WHERE id = $1
```

### 3. Automatic Cleanup
The database includes functions for cleaning up expired records:
```sql
-- Run these periodically (set up as cron jobs)
SELECT delete_expired_requests();
SELECT delete_expired_comments();
```

### 4. Performance
- All necessary indexes are created automatically
- Use the provided views for complex queries
- Consider using connection pooling for better performance

## Troubleshooting

### Common Issues
1. **UUID vs String**: Make sure to use proper UUID format
2. **Array Syntax**: Use PostgreSQL array syntax `ARRAY['item1', 'item2']`
3. **Case Sensitivity**: PostgreSQL is case-sensitive for identifiers
4. **Null Handling**: PostgreSQL handles nulls differently than MongoDB

### Testing Your Migration
Use the example queries in `postgresql_utilities.sql` to test that everything works correctly.
