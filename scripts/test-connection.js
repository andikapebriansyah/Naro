// test-connections.js
// Run with: node test-connections.js

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol} ${message}${colors.reset}`);
}

// Test MongoDB Connection
async function testMongoDB() {
  console.log('\n' + '='.repeat(50));
  log(colors.cyan, '🔍', 'Testing MongoDB Connection...');
  console.log('='.repeat(50));

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    log(colors.red, '✗', 'MONGODB_URI not found in .env.local');
    return false;
  }

  log(colors.blue, 'ℹ', `URI: ${mongoUri.substring(0, 30)}...`);

  try {
    const startTime = Date.now();
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });

    const duration = Date.now() - startTime;
    
    log(colors.green, '✓', `MongoDB Connected Successfully! (${duration}ms)`);
    log(colors.green, '✓', `Database: ${mongoose.connection.db.databaseName}`);
    log(colors.green, '✓', `Host: ${mongoose.connection.host}`);
    
    // Test write operation
    const testCollection = mongoose.connection.db.collection('connection_test');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    await testCollection.deleteOne({ test: true });
    
    log(colors.green, '✓', 'Write operation successful');
    
    await mongoose.connection.close();
    return true;
  } catch (error) {
    log(colors.red, '✗', `MongoDB Connection Failed: ${error.message}`);
    
    if (error.message.includes('ENOTFOUND')) {
      log(colors.yellow, '⚠', 'DNS resolution failed - Check your internet connection');
    } else if (error.message.includes('authentication failed')) {
      log(colors.yellow, '⚠', 'Authentication failed - Check your credentials');
    } else if (error.message.includes('timeout')) {
      log(colors.yellow, '⚠', 'Connection timeout - Check firewall/network settings');
    }
    
    return false;
  }
}

// Test Cloudinary Connection
async function testCloudinary() {
  console.log('\n' + '='.repeat(50));
  log(colors.cyan, '🔍', 'Testing Cloudinary Connection...');
  console.log('='.repeat(50));

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    log(colors.red, '✗', 'Cloudinary credentials not found in .env.local');
    log(colors.yellow, 'ℹ', 'Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    return false;
  }

  log(colors.blue, 'ℹ', `Cloud Name: ${cloudName}`);
  log(colors.blue, 'ℹ', `API Key: ${apiKey.substring(0, 6)}...`);

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  try {
    const startTime = Date.now();

    // Test 1: Ping API
    const pingResult = await cloudinary.api.ping();
    const pingDuration = Date.now() - startTime;
    
    log(colors.green, '✓', `Cloudinary API reachable (${pingDuration}ms)`);
    log(colors.green, '✓', `Status: ${pingResult.status}`);

    // Test 2: Upload a small test image (1x1 pixel)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const uploadStartTime = Date.now();
    const uploadResult = await cloudinary.uploader.upload(testImageBase64, {
      folder: 'connection_test',
      resource_type: 'image',
    });
    const uploadDuration = Date.now() - uploadStartTime;

    log(colors.green, '✓', `Image upload successful (${uploadDuration}ms)`);
    log(colors.green, '✓', `URL: ${uploadResult.secure_url}`);

    // Test 3: Delete test image
    await cloudinary.uploader.destroy(uploadResult.public_id);
    log(colors.green, '✓', 'Image deletion successful');

    return true;
  } catch (error) {
    log(colors.red, '✗', `Cloudinary Connection Failed: ${error.message}`);
    
    if (error.message.includes('Invalid API key')) {
      log(colors.yellow, '⚠', 'Invalid API credentials - Check your Cloudinary settings');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      log(colors.yellow, '⚠', 'Network error - Cannot reach Cloudinary servers');
      log(colors.yellow, '⚠', 'Check: Firewall, VPN, Proxy, or Internet connection');
    } else if (error.code === 'ERR_SOCKET_CONNECTION_TIMEOUT') {
      log(colors.yellow, '⚠', 'Socket timeout - Your network may be blocking Cloudinary');
      log(colors.yellow, '⚠', 'Try: Disable VPN, change DNS (8.8.8.8), or disable firewall temporarily');
    }
    
    return false;
  }
}

// Test network connectivity
async function testNetworkConnectivity() {
  console.log('\n' + '='.repeat(50));
  log(colors.cyan, '🔍', 'Testing Network Connectivity...');
  console.log('='.repeat(50));

  const testUrls = [
    { name: 'Google DNS', url: 'https://dns.google/resolve?name=google.com' },
    { name: 'Cloudinary API', url: 'https://api.cloudinary.com' },
    { name: 'MongoDB Atlas', url: 'https://cloud.mongodb.com' },
  ];

  for (const test of testUrls) {
    try {
      const startTime = Date.now();
      const response = await fetch(test.url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      const duration = Date.now() - startTime;
      
      log(colors.green, '✓', `${test.name}: Reachable (${duration}ms)`);
    } catch (error) {
      log(colors.red, '✗', `${test.name}: Unreachable (${error.message})`);
    }
  }
}

// Main test runner
async function runTests() {
  console.log('\n');
  log(colors.cyan, '🚀', 'Starting Connection Tests...');
  log(colors.cyan, 'ℹ', `Node.js: ${process.version}`);
  log(colors.cyan, 'ℹ', `Platform: ${process.platform}`);

  const results = {
    network: await testNetworkConnectivity(),
    mongodb: await testMongoDB(),
    cloudinary: await testCloudinary(),
  };

  // Summary
  console.log('\n' + '='.repeat(50));
  log(colors.cyan, '📊', 'Test Summary');
  console.log('='.repeat(50));

  const allPassed = Object.values(results).every(Boolean);

  if (allPassed) {
    log(colors.green, '✓', 'All connections successful!');
  } else {
    log(colors.red, '✗', 'Some connections failed. See details above.');
    
    // Recommendations
    console.log('\n' + '='.repeat(50));
    log(colors.yellow, '💡', 'Troubleshooting Tips:');
    console.log('='.repeat(50));
    
    if (!results.network) {
      console.log('  1. Check your internet connection');
      console.log('  2. Try disabling VPN or proxy');
      console.log('  3. Check firewall settings');
    }
    
    if (!results.mongodb) {
      console.log('  1. Verify MONGODB_URI in .env.local');
      console.log('  2. Check MongoDB Atlas IP whitelist');
      console.log('  3. Verify username/password');
    }
    
    if (!results.cloudinary) {
      console.log('  1. Verify Cloudinary credentials in .env.local');
      console.log('  2. Try changing DNS to 8.8.8.8 (Google DNS)');
      console.log('  3. Temporarily disable antivirus/firewall');
      console.log('  4. Check if ISP blocks Cloudinary');
    }
  }

  console.log('\n');
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  log(colors.red, '✗', `Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});