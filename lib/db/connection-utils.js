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
      
      // Check if it's a prepared statement conflict
      if (error.code === 'P2024' || 
          (error.message && error.message.includes('prepared statement')) ||
          (error.message && error.message.includes('42P05'))) {
        
        console.warn(`Database prepared statement conflict on attempt ${attempt}/${maxRetries}:`, error.message);
        
        // If not the last attempt, wait and retry
        if (attempt < maxRetries) {
          // Disconnect and reconnect to clear prepared statements
          try {
            await prisma.$disconnect();
            await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
          } catch (disconnectError) {
            console.warn('Error during disconnect:', disconnectError.message);
          }
          continue;
        }
      }
      
      // If it's not a prepared statement error or we've exhausted retries, throw
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
    return await prisma.$transaction(operations);
  }, maxRetries);
}