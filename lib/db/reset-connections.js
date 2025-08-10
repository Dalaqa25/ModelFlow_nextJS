import { prisma } from './prisma.js';

/**
 * Reset database connections to clear prepared statements
 * This can help resolve "prepared statement already exists" errors
 */
export async function resetDatabaseConnections() {
  try {
    console.log('Resetting database connections...');
    
    // Disconnect all existing connections
    await prisma.$disconnect();
    
    // Wait a moment for connections to fully close
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test reconnection
    await prisma.$connect();
    
    console.log('Database connections reset successfully');
    return true;
  } catch (error) {
    console.error('Error resetting database connections:', error);
    return false;
  }
}

/**
 * Execute a raw query to clear prepared statements (PostgreSQL specific)
 */
export async function clearPreparedStatements() {
  try {
    console.log('Clearing prepared statements...');
    
    // Get all prepared statement names
    const statements = await prisma.$queryRaw`
      SELECT name FROM pg_prepared_statements;
    `;
    
    // Deallocate each prepared statement
    for (const stmt of statements) {
      try {
        await prisma.$executeRaw`DEALLOCATE ${stmt.name}`;
      } catch (error) {
        // Ignore errors for statements that don't exist
        console.warn(`Could not deallocate statement ${stmt.name}:`, error.message);
      }
    }
    
    console.log(`Cleared ${statements.length} prepared statements`);
    return true;
  } catch (error) {
    console.error('Error clearing prepared statements:', error);
    return false;
  }
}