import { env } from '../config/env.js';
import axios from 'axios';

/**
 * Test eSewa Configuration
 * This script verifies eSewa setup and connectivity
 */

console.log('🔍 eSewa Configuration Check\n');
console.log('='.repeat(50));

// 1. Check Environment Variables
console.log('\n📋 Environment Variables:');
console.log('  NODE_ENV:', env.NODE_ENV);
console.log('  ESEWA_MERCHANT_ID:', env.ESEWA_MERCHANT_ID);
console.log('  ESEWA_SECRET_KEY:', env.ESEWA_SECRET_KEY ? '***' + env.ESEWA_SECRET_KEY.slice(-4) : 'NOT SET');
console.log('  ESEWA_ENV:', env.ESEWA_ENV);
console.log('  CLIENT_ORIGIN:', env.CLIENT_ORIGIN);

// 2. Determine Test Mode
const isTestMode = 
  env.NODE_ENV === 'development' || 
  env.ESEWA_MERCHANT_ID === 'EPAYTEST' || 
  env.ESEWA_ENV === 'test';

console.log('\n🌐 Environment Detection:');
console.log('  Mode:', isTestMode ? 'TEST (UAT)' : 'PRODUCTION');
console.log('  Payment URL:', isTestMode 
  ? 'https://uat.esewa.com.np/epay/main'
  : 'https://esewa.com.np/epay/main'
);

// 3. Test eSewa URL Connectivity
console.log('\n🌐 Testing eSewa URL Connectivity:');

const testUrls = [
  {
    name: 'UAT (Test) URL',
    url: 'https://uat.esewa.com.np/epay/main',
    shouldWork: isTestMode
  },
  {
    name: 'Production URL',
    url: 'https://esewa.com.np/epay/main',
    shouldWork: !isTestMode
  }
];

for (const testUrl of testUrls) {
  try {
    console.log(`\n  Testing: ${testUrl.name}`);
    console.log(`  URL: ${testUrl.url}`);
    
    const startTime = Date.now();
    const response = await axios.get(testUrl.url, {
      timeout: 10000,
      validateStatus: () => true // Accept any status code
    });
    const responseTime = Date.now() - startTime;
    
    console.log(`  ✅ Status: ${response.status} ${response.statusText}`);
    console.log(`  ⏱️  Response Time: ${responseTime}ms`);
    
    if (response.status === 200 || response.status === 405) {
      console.log(`  ✅ URL is accessible`);
    } else {
      console.log(`  ⚠️  URL returned status ${response.status}`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log(`  ❌ Cannot reach eSewa servers - Network issue`);
    }
  }
}

// 4. Check Required Configuration
console.log('\n✅ Configuration Check:');
const checks = [
  {
    name: 'Merchant ID',
    value: env.ESEWA_MERCHANT_ID,
    required: true,
    valid: env.ESEWA_MERCHANT_ID && env.ESEWA_MERCHANT_ID !== ''
  },
  {
    name: 'Secret Key',
    value: env.ESEWA_SECRET_KEY,
    required: true,
    valid: env.ESEWA_SECRET_KEY && env.ESEWA_SECRET_KEY !== ''
  },
  {
    name: 'Client Origin',
    value: env.CLIENT_ORIGIN,
    required: true,
    valid: env.CLIENT_ORIGIN && env.CLIENT_ORIGIN !== ''
  }
];

let allValid = true;
for (const check of checks) {
  const status = check.valid ? '✅' : '❌';
  console.log(`  ${status} ${check.name}: ${check.valid ? 'SET' : 'MISSING'}`);
  if (!check.valid && check.required) {
    allValid = false;
  }
}

// 5. Summary
console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('✅ All configuration checks passed!');
  console.log(`\n📝 Next Steps:`);
  console.log(`  1. Test payment initiation endpoint: POST /api/v1/payments/esewa/initiate`);
  console.log(`  2. Check backend logs when initiating payment`);
  console.log(`  3. Verify payment_url in response matches: ${isTestMode ? 'https://uat.esewa.com.np/epay/main' : 'https://esewa.com.np/epay/main'}`);
} else {
  console.log('❌ Configuration issues found!');
  console.log(`\n📝 Fix:`);
  console.log(`  1. Set missing environment variables in .env file`);
  console.log(`  2. Restart the backend server`);
}

console.log('\n');


