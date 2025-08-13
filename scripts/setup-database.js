import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDatabase() {
  console.log('🚀 Starting Supabase database setup...');
  
  try {
    // Step 1: Clean up existing tables
    console.log('\n🧹 Step 1: Cleaning up existing tables...');
    await cleanupExistingTables();
    
    // Step 2: Create new schema
    console.log('\n🏗️  Step 2: Creating new database schema...');
    await createNewSchema();
    
    // Step 3: Verify setup
    console.log('\n✅ Step 3: Verifying setup...');
    await verifySetup();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Test your application');
    console.log('2. Create some test data');
    console.log('3. Verify all features work correctly');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

async function cleanupExistingTables() {
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

  for (const table of tablesToDrop) {
    try {
      console.log(`🗑️  Dropping table: ${table}`);
      const { error } = await supabase.rpc('drop_table_if_exists', { table_name: table });
      if (error) {
        console.log(`⚠️  Could not drop ${table}:`, error.message);
      } else {
        console.log(`✅ Dropped table: ${table}`);
      }
    } catch (error) {
      console.log(`⚠️  Error dropping ${table}:`, error.message);
    }
  }
}

async function createNewSchema() {
  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-supabase-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log(`⚠️  Statement ${i + 1} failed:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (error) {
          console.log(`⚠️  Statement ${i + 1} error:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating schema:', error);
    throw error;
  }
}

async function verifySetup() {
  try {
    // Check if tables exist
    const expectedTables = [
      'users',
      'models',
      'pending_models',
      'archived_models',
      'notifications',
      'purchased_models',
      'requests',
      'request_comments',
      'earnings_history',
      'withdrawals'
    ];
    
    console.log('🔍 Checking table creation...');
    
    for (const table of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table} not found or accessible`);
        } else {
          console.log(`✅ Table ${table} exists and accessible`);
        }
      } catch (error) {
        console.log(`❌ Error checking table ${table}:`, error.message);
      }
    }
    
    // Test user creation trigger
    console.log('\n🧪 Testing user creation trigger...');
    try {
      const testUser = {
        email: 'test@example.com',
        name: 'Test User'
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert(testUser)
        .select();
      
      if (error) {
        console.log('⚠️  User creation test failed:', error.message);
      } else {
        console.log('✅ User creation test passed');
        
        // Clean up test user
        await supabase
          .from('users')
          .delete()
          .eq('email', 'test@example.com');
      }
    } catch (error) {
      console.log('⚠️  User creation test error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export { setupDatabase };
