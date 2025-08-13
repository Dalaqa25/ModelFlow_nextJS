import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySetup() {
  console.log('🔍 Verifying Supabase database setup...');
  
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
    
    console.log('\n📊 Checking table existence...');
    
    for (const table of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: Exists and accessible`);
        }
      } catch (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      }
    }
    
    // Test user creation
    console.log('\n🧪 Testing user creation...');
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
        console.log(`❌ User creation test failed: ${error.message}`);
      } else {
        console.log('✅ User creation test passed');
        
        // Clean up test user
        await supabase
          .from('users')
          .delete()
          .eq('email', 'test@example.com');
        console.log('🧹 Test user cleaned up');
      }
    } catch (error) {
      console.log(`❌ User creation test error: ${error.message}`);
    }
    
    // Test API endpoints
    console.log('\n🌐 Testing API endpoints...');
    
    const baseUrl = 'http://localhost:3000';
    const endpoints = [
      '/api/models',
      '/api/notifications',
      '/api/user'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`);
        if (response.ok) {
          console.log(`✅ ${endpoint}: Working`);
        } else {
          console.log(`⚠️  ${endpoint}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Setup verification completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Test user registration/login');
    console.log('2. Test model upload (if available)');
    console.log('3. Test notifications');
    console.log('4. Verify all features work correctly');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run verification if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifySetup();
}

export { verifySetup };
