// Quick script to check TikTok connections in database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from parent directory
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConnections() {
  console.log('Checking TikTok connections...\n');
  
  // Get all TikTok connections
  const { data: connections, error } = await supabase
    .from('user_automations')
    .select('*')
    .eq('provider', 'tiktok');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${connections?.length || 0} TikTok connections:\n`);
  
  if (connections && connections.length > 0) {
    connections.forEach((conn, i) => {
      console.log(`Connection ${i + 1}:`);
      console.log(`  User ID: ${conn.user_id}`);
      console.log(`  Automation ID: ${conn.automation_id}`);
      console.log(`  Has Access Token: ${!!conn.access_token}`);
      console.log(`  Has Refresh Token: ${!!conn.refresh_token}`);
      console.log(`  Token Expiry: ${conn.token_expiry}`);
      console.log(`  Is Active: ${conn.is_active}`);
      console.log(`  Created: ${conn.created_at}`);
      console.log('');
    });
  } else {
    console.log('No TikTok connections found in database!');
  }
}

checkConnections();
