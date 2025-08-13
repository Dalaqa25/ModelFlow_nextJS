import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // List of tables that might have been created by Prisma
    const tablesToDrop = [
      'users',
      'models', 
      'pendingModels',
      'archivedModels',
      'notifications',
      'purchasedModels',
      'requests',
      'earningsHistory',
      'withdrawals',
      '_prisma_migrations'
    ];

    console.log('📋 Tables to check and drop:');
    tablesToDrop.forEach(table => console.log(`  - ${table}`));

    // Get current tables
    const { data: tables, error: listError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (listError) {
      console.error('❌ Error listing tables:', listError);
      return;
    }

    const existingTables = tables.map(t => t.table_name);
    console.log('\n📊 Existing tables:', existingTables);

    // Drop tables that exist
    for (const table of tablesToDrop) {
      if (existingTables.includes(table)) {
        console.log(`🗑️  Dropping table: ${table}`);
        const { error } = await supabase.rpc('drop_table_if_exists', { table_name: table });
        if (error) {
          console.log(`⚠️  Could not drop ${table}:`, error.message);
        } else {
          console.log(`✅ Dropped table: ${table}`);
        }
      } else {
        console.log(`⏭️  Table ${table} does not exist, skipping`);
      }
    }

    console.log('\n🎉 Database cleanup completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Run the Supabase table creation script');
    console.log('2. Test the new database structure');
    console.log('3. Migrate any existing data if needed');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupDatabase();
}

export { cleanupDatabase };
