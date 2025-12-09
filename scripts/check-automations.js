// Quick script to check what automations exist in the database
const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAutomations() {
  console.log('🔍 Checking automations in database...\n');

  const { data, error } = await supabase
    .from('automations')
    .select('id, name, description, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('📭 No automations found in database.');
    console.log('\n💡 To add an automation:');
    console.log('   1. Go to http://localhost:3000/main');
    console.log('   2. Click "Upload Automation" button');
    console.log('   3. Fill in the form and upload a workflow JSON file');
    return;
  }

  console.log(`✅ Found ${data.length} automation(s):\n`);
  data.forEach((auto, i) => {
    console.log(`${i + 1}. ${auto.name}`);
    console.log(`   UUID: ${auto.id}`);
    console.log(`   Active: ${auto.is_active}`);
    console.log(`   Created: ${new Date(auto.created_at).toLocaleString()}`);
    console.log(`   Description: ${auto.description.substring(0, 60)}...`);
    console.log('');
  });
}

checkAutomations();
