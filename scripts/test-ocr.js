// scripts/test-ocr.js
// Testing script untuk OCR system
const { testKTPParser } = require('../src/lib/ocrTest');

console.log('=== Testing KTP Parser System ===\n');

try {
  const results = testKTPParser();
  
  console.log('\n=== Test Results ===');
  console.log('Primary Parser Success:', results.primary.success);
  console.log('Alternative Parser Success:', results.alternative.success);
  console.log('Primary Confidence:', results.primary.confidence);
  console.log('Alternative Confidence:', results.alternative.confidence);
  
  if (results.primary.data) {
    console.log('\nExtracted Data:');
    Object.entries(results.primary.data).forEach(([key, value]) => {
      if (value && key !== 'rawText') {
        console.log(`  ${key}: ${value}`);
      }
    });
  }
  
  if (results.primary.missingFields?.length > 0) {
    console.log('\nMissing Fields:', results.primary.missingFields.join(', '));
  }
  
  console.log('\n✅ KTP Parser test completed successfully!');
} catch (error) {
  console.error('❌ Test failed:', error);
}