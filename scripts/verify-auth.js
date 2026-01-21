#!/usr/bin/env node

/**
 * Quick auth verification script
 * Run: node scripts/verify-auth.js
 */

console.log('🔍 Verifying Supabase Auth Configuration...\n');

// Check environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

let allPresent = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ Missing: ${varName}`);
    allPresent = false;
  } else {
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${varName}: ${preview}`);
  }
});

console.log();

if (!allPresent) {
  console.log('⚠️  Please create a .env.local file with the required variables');
  console.log('   See .env.example for template\n');
  process.exit(1);
}

console.log('✅ All required environment variables are set!');
console.log('\n📋 Next steps:');
console.log('   1. Start dev server: npm run dev');
console.log('   2. Go to http://localhost:3000');
console.log('   3. Try to register/login');
console.log('   4. Check browser console for any errors');
console.log('   5. In DevTools → Application → Cookies, look for "sb-*-auth-token"\n');
