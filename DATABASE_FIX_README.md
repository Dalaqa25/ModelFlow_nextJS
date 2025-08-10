# Database Connection Fix for Prepared Statement Errors

## Problem
The application was experiencing PostgreSQL prepared statement conflicts with error messages like:
```
Error [PrismaClientUnknownRequestError]: prepared statement "s8" already exists
ConnectorError(ConnectorError { user_facing_error: None, kind: QueryError(PostgresError { code: "42P05", message: "prepared statement \"s8\" already exists", severity: "ERROR", detail: None, column: None, hint: None }), transient: false })
```

This typically occurs in Next.js development environments with Prisma when:
- Multiple Prisma client instances are created due to hot reloading
- Prepared statements with the same names are registered multiple times
- Database connection pool isn't properly managed

## Solution Implemented

### 1. Enhanced Prisma Client Configuration (`lib/db/prisma.js`)
- Added proper connection pooling and cleanup
- Implemented graceful shutdown handlers
- Added fallback for environment variable names
- Reduced logging in development to prevent noise

### 2. Database Retry Utility (`lib/db/connection-utils.js`)
- Created `withDatabaseRetry()` function that automatically retries database operations
- Detects prepared statement conflicts and handles reconnection
- Implements exponential backoff for retries
- Supports transaction retries with `withTransactionRetry()`

### 3. Connection Reset Utilities (`lib/db/reset-connections.js`)
- `resetDatabaseConnections()` - Cleanly disconnects and reconnects
- `clearPreparedStatements()` - Manually clears PostgreSQL prepared statements

### 4. Debug API Endpoint (`app/api/debug/reset-db/route.js`)
- Provides a way to reset database connections without restarting the server
- Can be called when prepared statement errors occur
- Usage: `POST /api/debug/reset-db`

### 5. Updated Critical API Routes
Updated the following routes to use retry logic:
- `/api/user` - User authentication and profile management
- `/api/models` - Model listing and creation
- `/api/pending-models` - Pending model management
- `/api/models/user-models` - User's model listing

## Usage

### Automatic Retry
Most database operations now automatically retry on prepared statement conflicts:
```javascript
import { withDatabaseRetry } from '@/lib/db/connection-utils';

const user = await withDatabaseRetry(async () => {
    return await prisma.user.findUnique({
        where: { email }
    });
});
```

### Manual Connection Reset
If you encounter persistent issues, you can reset connections:

#### Via API:
```bash
curl -X POST http://localhost:3000/api/debug/reset-db
```

#### Programmatically:
```javascript
import { resetDatabaseConnections } from '@/lib/db/reset-connections';
await resetDatabaseConnections();
```

## Environment Variables
Ensure you have the correct database URL set:
```env
DATABASE_URL="your_database_url_here"
DIRECT_URL="your_direct_database_url_here"  # For migrations
```

The system supports both `DATABASE_URL` and `SUPABASE_DATABASE_URL` for backward compatibility.

## Monitoring
The system now logs retry attempts and connection resets:
- Watch for "Database prepared statement conflict" warnings
- Monitor "Database connections reset successfully" messages
- Check for exponential backoff delays in logs

## Prevention Tips
1. **Restart Development Server**: When making schema changes, restart the dev server
2. **Use Debug Endpoint**: Call `/api/debug/reset-db` when errors persist
3. **Monitor Logs**: Watch for connection-related warnings
4. **Database Migrations**: Run `npx prisma generate` after schema changes

## Files Modified
- `lib/db/prisma.js` - Enhanced Prisma client configuration
- `lib/db/connection-utils.js` - New retry utilities
- `lib/db/reset-connections.js` - New connection reset utilities
- `app/api/debug/reset-db/route.js` - New debug endpoint
- `prisma/schema.prisma` - Updated generator configuration
- Multiple API routes updated with retry logic

## Testing
After implementing these changes:
1. The prepared statement errors should be automatically handled
2. Database operations will retry up to 3 times with exponential backoff
3. Connection issues will be logged but won't crash the application
4. The debug endpoint can be used for manual intervention when needed