/**
 * Scope Validation Script
 * Run this to verify all scopes are configured correctly
 * 
 * Usage: node validate-scopes.js
 */

// Expected scopes that should be in Google Cloud Console
const EXPECTED_SCOPES = [
  // Basic (3)
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  
  // Drive (2)
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  
  // Sheets (1)
  'https://www.googleapis.com/auth/spreadsheets',
  
  // Docs (1)
  'https://www.googleapis.com/auth/documents',
  
  // Gmail (3)
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.readonly',
  
  // Calendar (2)
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  
  // YouTube (2)
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.upload',
  
  // Slides (1)
  'https://www.googleapis.com/auth/presentations',
  
  // Forms (2)
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  
  // Tasks (1)
  'https://www.googleapis.com/auth/tasks',
  
  // Contacts (1)
  'https://www.googleapis.com/auth/contacts',
  
  // Photos (1)
  'https://www.googleapis.com/auth/photoslibrary',
  
  // Analytics (1)
  'https://www.googleapis.com/auth/analytics.readonly',
];

// Import your scope manager
const { getAllScopes } = require('./lib/auth/scope-manager.js');

console.log('🔍 Validating Google OAuth Scopes...\n');

// Get scopes from your code
const codeScopes = getAllScopes();

console.log(`Expected scopes: ${EXPECTED_SCOPES.length}`);
console.log(`Scopes in code: ${codeScopes.length}\n`);

// Check for missing scopes
const missingScopes = EXPECTED_SCOPES.filter(scope => !codeScopes.includes(scope));
const extraScopes = codeScopes.filter(scope => !EXPECTED_SCOPES.includes(scope));

if (missingScopes.length === 0 && extraScopes.length === 0) {
  console.log('✅ SUCCESS! All scopes are correctly configured.\n');
  console.log('📋 Scopes by service:');
  console.log('   • Basic: 3 scopes');
  console.log('   • Drive: 2 scopes');
  console.log('   • Sheets: 1 scope');
  console.log('   • Docs: 1 scope');
  console.log('   • Gmail: 3 scopes');
  console.log('   • Calendar: 2 scopes');
  console.log('   • YouTube: 2 scopes');
  console.log('   • Slides: 1 scope');
  console.log('   • Forms: 2 scopes');
  console.log('   • Tasks: 1 scope');
  console.log('   • Contacts: 1 scope');
  console.log('   • Photos: 1 scope');
  console.log('   • Analytics: 1 scope');
  console.log('\n✅ Total: 21 scopes\n');
  console.log('🎯 Next step: Add these same 21 scopes to Google Cloud Console OAuth consent screen');
} else {
  if (missingScopes.length > 0) {
    console.log('❌ MISSING SCOPES in your code:');
    missingScopes.forEach(scope => console.log(`   - ${scope}`));
    console.log('');
  }
  
  if (extraScopes.length > 0) {
    console.log('⚠️  EXTRA SCOPES in your code (not in expected list):');
    extraScopes.forEach(scope => console.log(`   - ${scope}`));
    console.log('');
  }
}

// Print full list for easy copy-paste
console.log('\n📋 Complete scope list for Google Cloud Console:\n');
EXPECTED_SCOPES.forEach((scope, index) => {
  console.log(`${index + 1}. ${scope}`);
});

console.log('\n💡 Copy this list and add each scope to:');
console.log('   Google Cloud Console → OAuth consent screen → Scopes → Add or Remove Scopes\n');
