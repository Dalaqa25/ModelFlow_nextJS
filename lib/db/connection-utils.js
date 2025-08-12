import { prisma } from './prisma.js';

/**
 * Safely execute a database operation with proper error handling
 * and connection cleanup for prepared statement conflicts
 */
export async function withDatabaseRetry(operation, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      console.warn(`Database operation failed on attempt ${attempt}/${maxRetries}:`, error.message);
      
      // Check if it's a connection-related error
      if (error.code === 'P2024' || 
          error.message.includes('Engine is not yet connected') ||
          error.message.includes('Connection terminated') ||
          error.message.includes('ECONNRESET') ||
          (error.message && error.message.includes('prepared statement')) ||
          (error.message && error.message.includes('42P05'))) {
        
        console.warn(`Database connection issue detected on attempt ${attempt}/${maxRetries}`);
        
        // If not the last attempt, wait and retry
        if (attempt < maxRetries) {
          try {
            // Disconnect and reconnect to clear prepared statements and reset connection
            await prisma.$disconnect();
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            await prisma.$connect();
            console.log(`Reconnected to database after attempt ${attempt}`);
          } catch (disconnectError) {
            console.warn('Error during disconnect/reconnect:', disconnectError.message);
            // Continue anyway, the next attempt might work
          }
          continue;
        }
      }
      
      // If it's not a connection error or we've exhausted retries, throw
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Execute multiple database operations in a transaction with retry logic
 */
export async function withTransactionRetry(operations, maxRetries = 3) {
  return withDatabaseRetry(async () => {
    return await prisma.$transaction(operations, {
      maxWait: 10000, // 10 seconds max wait
      timeout: 30000, // 30 seconds timeout
    });
  }, maxRetries);
}

/**
 * Execute a read operation with connection health check
 */
export async function withReadRetry(operation, maxRetries = 2) {
  return withDatabaseRetry(operation, maxRetries);
}

/**
 * Execute a write operation with enhanced retry logic
 */
export async function withWriteRetry(operation, maxRetries = 3) {
  return withDatabaseRetry(operation, maxRetries);
}

/**
 * Get database connection status
 */
export async function getConnectionStatus() {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}