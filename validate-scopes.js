/**
 * Scope Validation Script
 * Run this to verify all scopes are configured correctly
 * 
 * Usage: node validate-scopes.js
 */

// Expected scopes that MUST match Google Cloud Console configuration
// Last updated: Based on actual Google Cloud Console setup
const EXPECTED_SCOPES = [
  // Basic (3) - NON-SENSITIVE
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  
  // Drive (1) - NON-SENSITIVE
  'https://www.googleapis.com/auth/drive.file', // Per-file access only
  
  // Sheets (1) - SENSITIVE
  'https://www.googleapis.com/auth/spreadsheets',
  
  // Gmail (2) - SENSITIVE
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
];

// Import your scope manager
const { getAllScopes } = require('./lib/auth/scope-manager.js');

console.log('🔍 Validating Google OAuth Scopes...\n');

// Get scopes from your code
const codeScopes = getAllScopes();

console.log(`Expected scopes (from Google Cloud Console): ${EXPECTED_SCOPES.length}`);
console.log(`Scopes in code: ${codeScopes.length}\n`);

// Check for missing scopes
const missingScopes = EXPECTED_SCOPES.filter(scope => !codeScopes.includes(scope));
const extraScopes = codeScopes.filter(scope => !EXPECTED_SCOPES.includes(scope));

if (missingScopes.length === 0 && extraScopes.length === 0) {
  console.log('✅ SUCCESS! All scopes match Google Cloud Console configuration.\n');
  console.log('📋 Approved scopes by service:');
  console.log('   • Basic (openid, email, profile): 3 scopes');
  console.log('   • Drive (per-file access): 1 scope');
  console.log('   • Sheets: 1 scope');
  console.log('   • Gmail: 2 scopes');
  console.log('\n✅ Total: 7 scopes\n');
  console.log('🎯 Your app will only request these approved scopes');
} else {
  if (missingScopes.length > 0) {
    console.log('❌ MISSING SCOPES in your code (but in Google Cloud Console):');
    missingScopes.forEach(scope => console.log(`   - ${scope}`));
    console.log('\n⚠️  Add these to lib/auth/scope-manager.js\n');
  }
  
  if (extraScopes.length > 0) {
    console.log('⚠️  EXTRA SCOPES in your code (NOT in Google Cloud Console):');
    extraScopes.forEach(scope => console.log(`   - ${scope}`));
    console.log('\n⚠️  These will cause OAuth errors! Remove from lib/auth/scope-manager.js\n');
  }
}

// Print full list for verification
console.log('\n📋 Complete scope list (matches Google Cloud Console):\n');
EXPECTED_SCOPES.forEach((scope, index) => {
  console.log(`${index + 1}. ${scope}`);
});

console.log('\n💡 These scopes are configured in:');
console.log('   Google Cloud Console → APIs & Services → OAuth consent screen → Scopes\n');
console.log('✅ Non-sensitive scopes: openid, email, profile, drive.file, gmail.addons.current.action.compose');
console.log('⚠️  Sensitive scopes (require verification): spreadsheets, gmail.send\n');
