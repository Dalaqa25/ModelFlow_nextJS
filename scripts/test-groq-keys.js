#!/usr/bin/env node

/**
 * Test all Groq API keys to see which ones are valid
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const OpenAI = require('openai');

const GROQ_API_KEYS = [
  { name: 'GROQ_API_KEY', key: process.env.GROQ_API_KEY },
  { name: 'GROQ_API_KEY_2', key: process.env.GROQ_API_KEY_2 },
  { name: 'GROQ_API_KEY_3', key: process.env.GROQ_API_KEY_3 },
  { name: 'GROQ_API_KEY_4', key: process.env.GROQ_API_KEY_4 },
  { name: 'GROQ_API_KEY_5', key: process.env.GROQ_API_KEY_5 },
  { name: 'GROQ_API_KEY_6', key: process.env.GROQ_API_KEY_6 },
  { name: 'GROQ_API_KEY_7', key: process.env.GROQ_API_KEY_7 },
  { name: 'GROQ_API_KEY_8', key: process.env.GROQ_API_KEY_8 },
].filter(item => item.key);

console.log('🔍 Testing Groq API keys...\n');
console.log(`Found ${GROQ_API_KEYS.length} keys to test\n`);

async function testKey(name, key) {
  try {
    const client = new OpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: key,
    });

    // Make a minimal API call to test the key
    await client.chat.completions.create({
      messages: [{ role: "user", content: "Hi" }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 5,
    });

    console.log(`✅ ${name}: VALID (${key.substring(0, 20)}...${key.substring(key.length - 4)})`);
    return true;
  } catch (error) {
    if (error.status === 401) {
      console.log(`❌ ${name}: INVALID - 401 Unauthorized (${key.substring(0, 20)}...${key.substring(key.length - 4)})`);
    } else if (error.status === 429) {
      console.log(`⚠️  ${name}: VALID but rate limited (${key.substring(0, 20)}...${key.substring(key.length - 4)})`);
      return true;
    } else {
      console.log(`⚠️  ${name}: ERROR - ${error.message} (${key.substring(0, 20)}...${key.substring(key.length - 4)})`);
    }
    return false;
  }
}

async function testAllKeys() {
  const results = [];
  
  for (const { name, key } of GROQ_API_KEYS) {
    const isValid = await testKey(name, key);
    results.push({ name, key, isValid });
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log('='.repeat(60));
  
  const validKeys = results.filter(r => r.isValid);
  const invalidKeys = results.filter(r => !r.isValid);
  
  console.log(`\n✅ Valid keys: ${validKeys.length}`);
  validKeys.forEach(r => console.log(`   - ${r.name}`));
  
  if (invalidKeys.length > 0) {
    console.log(`\n❌ Invalid keys: ${invalidKeys.length}`);
    invalidKeys.forEach(r => console.log(`   - ${r.name}`));
    console.log('\n💡 Remove these keys from your .env.local file');
  }
  
  console.log('\n' + '='.repeat(60));
}

testAllKeys().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
