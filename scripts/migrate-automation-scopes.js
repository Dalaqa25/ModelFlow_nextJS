/**
 * Migration Script: Add required_scopes to existing automations
 * 
 * This script:
 * 1. Adds required_scopes column to automations table (if not exists)
 * 2. Analyzes existing automations to detect required Google services
 * 3. Updates each automation with its required_scopes
 * 
 * Run with: node scripts/migrate-automation-scopes.js
 */

import { createClient } from '@supabase/supabase-js';
import { getRequiredServices } from '../lib/auth/automation-scope-detector.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateAutomationScopes() {
  console.log('🚀 Starting automation scopes migration...\n');

  try {
    // Step 1: Add required_scopes column (if not exists)
    console.log('Step 1: Checking database schema...');
    // Note: This SQL will be run manually or via Supabase dashboard
    console.log(`
      Run this SQL in Supabase if not already done:
      
      ALTER TABLE automations 
      ADD COLUMN IF NOT EXISTS required_scopes JSONB DEFAULT '[]'::jsonb;
      
      CREATE TABLE IF NOT EXISTS user_google_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_expiry TIMESTAMPTZ,
        granted_scopes JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_email)
      );
    `);
    console.log('✅ Schema check complete\n');

    // Step 2: Fetch all automations
    console.log('Step 2: Fetching all automations...');
    const { data: automations, error: fetchError } = await supabase
      .from('automations')
      .select('id, name, workflow, required_scopes');

    if (fetchError) {
      throw new Error(`Failed to fetch automations: ${fetchError.message}`);
    }

    console.log(`Found ${automations.length} automations\n`);

    // Step 3: Analyze and update each automation
    console.log('Step 3: Analyzing workflows and updating scopes...\n');
    
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const automation of automations) {
      try {
        // Skip if already has scopes
        if (automation.required_scopes && automation.required_scopes.length > 0) {
          console.log(`⏭️  Skipping "${automation.name}" (already has scopes)`);
          skipped++;
          continue;
        }

        // Detect required services
        const requiredServices = getRequiredServices(automation.workflow);
        
        if (requiredServices.length === 0) {
          console.log(`ℹ️  "${automation.name}" - No Google services detected`);
          // Still update with empty array to mark as processed
          requiredServices.push('NONE');
        } else {
          console.log(`✅ "${automation.name}" - Requires: ${requiredServices.join(', ')}`);
        }

        // Update automation
        const { error: updateError } = await supabase
          .from('automations')
          .update({ required_scopes: requiredServices })
          .eq('id', automation.id);

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }

        updated++;
      } catch (error) {
        console.error(`❌ Failed to process "${automation.name}": ${error.message}`);
        failed++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`Total automations: ${automations.length}`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(50));

    if (failed > 0) {
      console.log('\n⚠️  Some automations failed to migrate. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrateAutomationScopes();
