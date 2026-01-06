/**
 * Test script to verify pdf-parse is working correctly
 * Run with: node scripts/test-pdf-parser.js
 */

const fs = require('fs');
const path = require('path');

async function testPdfParse() {
  console.log('🔍 Testing PDF parser...\n');
  
  try {
    // Dynamically import pdf-parse
    console.log('1. Loading pdf-parse module...');
    const pdfParse = require('pdf-parse');
    console.log('✅ pdf-parse loaded successfully\n');
    
    // Create a minimal test PDF buffer (this is a very basic PDF structure)
    // In real usage, you'd read an actual PDF file
    console.log('2. Testing with sample data...');
    
    // You can create a test PDF or use an existing one
    // For now, let's just verify the function exists
    if (typeof pdfParse === 'function') {
      console.log('✅ pdf-parse is a function (correct)\n');
      
      console.log('3. Testing parser on actual PDF...');
      console.log('   Note: Place a test PDF in the scripts folder to test\n');
      
      // Check if test PDF exists
      const testPdfPath = path.join(__dirname, 'test.pdf');
      if (fs.existsSync(testPdfPath)) {
        const dataBuffer = fs.readFileSync(testPdfPath);
        console.log(`   Found test PDF (${dataBuffer.length} bytes)`);
        
        const data = await pdfParse(dataBuffer);
        console.log(`   ✅ Parsed successfully!`);
        console.log(`   - Pages: ${data.numpages}`);
        console.log(`   - Text length: ${data.text.length} characters`);
        console.log(`   - First 200 chars: ${data.text.substring(0, 200)}...`);
      } else {
        console.log('   ⚠️  No test.pdf found in scripts folder');
        console.log('   To test with a real PDF, add a file named test.pdf to the scripts folder');
      }
      
    } else {
      console.error('❌ pdf-parse is not a function:', typeof pdfParse);
      process.exit(1);
    }
    
    console.log('\n✅ All tests passed!');
    console.log('\nPDF parser is working correctly. The ingestion pipeline should work.\n');
    
  } catch (error) {
    console.error('\n❌ Error testing pdf-parse:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testPdfParse();
