#!/usr/bin/env node

/**
 * Update TikTok Scheduled Auto-Post workflow in database
 * This updates the workflow JSON with the fixed Supabase Storage API call
 * 
 * Run from ModelFlow_nextJS directory: node ../scripts/update-tiktok-workflow.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateWorkflow() {
  console.log('🔄 Updating TikTok Scheduled Auto-Post workflow...\n');

  // Read the updated workflow JSON
  const workflowPath = path.join(__dirname, '../../automations/tiktok-scheduled-auto-post.json');
  const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
  const workflow = JSON.parse(workflowContent);

  console.log(`📄 Loaded workflow: ${workflow.name}`);
  console.log(`   Nodes: ${workflow.nodes.length}`);
  console.log(`   Description: ${workflow.description}\n`);

  // Update in database
  console.log('🔍 Searching for workflow in database...');
  const { data, error } = await supabase
    .from('automation_templates')
    .update({
      workflow_json: workflow,
      updated_at: new Date().toISOString()
    })
    .eq('name', 'TikTok Scheduled Auto-Post from Supabase')
    .select();

  console.log('   Response data:', data);
  console.log('   Response error:', error);

  if (error) {
    console.error('❌ Error updating workflow:');
    console.error('   Message:', error.message || 'Unknown error');
    console.error('   Details:', JSON.stringify(error, null, 2));
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('⚠️  Workflow not found in database. Creating new entry...\n');
    
    // Insert new workflow
    const { data: insertData, error: insertError } = await supabase
      .from('automation_templates')
      .insert({
        name: workflow.name,
        description: workflow.description,
        workflow_json: workflow,
        tags: workflow.tags || [],
        category: 'social-media',
        is_active: true
      })
      .select();

    if (insertError) {
      console.error('❌ Error creating workflow:', insertError.message);
      process.exit(1);
    }

    console.log('✅ Workflow created successfully!');
    console.log(`   ID: ${insertData[0].id}`);
  } else {
    console.log('✅ Workflow updated successfully!');
    console.log(`   ID: ${data[0].id}`);
    console.log(`   Updated at: ${data[0].updated_at}`);
  }

  console.log('\n🎉 Done! The workflow is now ready to use in your app.');
  console.log('\n📝 What changed:');
  console.log('   - Fixed Supabase Storage API request body format');
  console.log('   - Changed from jsonBody to bodyParameters for better compatibility');
  console.log('   - The workflow now correctly lists videos from your storage bucket');
}

updateWorkflow().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
