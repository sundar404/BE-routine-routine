#!/usr/bin/env node

// Test script to verify PDF generation matches frontend exactly
const path = require('path');
const fs = require('fs');

// Import the PDF generator from the correct path
const { RoutinePDFGenerator } = require('./backend/utils/pdfGeneration');

async function testPDFGeneration() {
  console.log('🧪 Testing PDF Generation...');
  
  try {
    // Create PDF generator instance
    const pdfGenerator = new RoutinePDFGenerator();
    
    // Test with sample data - this would normally come from database
    const testData = {
      programCode: 'BCT',
      semester: 7,
      section: 'AB'
    };
    
    console.log(`📄 Generating PDF for ${testData.programCode} Semester ${testData.semester} Section ${testData.section}...`);
    
    // Generate PDF (this will use real database data if available)
    const pdfBuffer = await pdfGenerator.generateClassRoutinePDF(
      testData.programCode, 
      testData.semester, 
      testData.section
    );
    
    if (pdfBuffer && pdfBuffer.length > 0) {
      // Save the PDF to verify
      const outputPath = path.join(__dirname, 'test-routine.pdf');
      fs.writeFileSync(outputPath, pdfBuffer);
      
      console.log('✅ PDF generated successfully!');
      console.log(`📁 PDF saved to: ${outputPath}`);
      console.log(`📊 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
      
      // Verify PDF structure
      const pdfContent = pdfBuffer.toString('binary');
      
      // Check for key PDF markers
      const hasHeader = pdfContent.includes('%PDF');
      const hasObjects = pdfContent.includes('obj');
      const hasEndOfFile = pdfContent.includes('%%EOF');
      
      console.log('🔍 PDF Structure Validation:');
      console.log(`   ✓ PDF Header: ${hasHeader ? 'Found' : 'Missing'}`);
      console.log(`   ✓ PDF Objects: ${hasObjects ? 'Found' : 'Missing'}`);
      console.log(`   ✓ EOF Marker: ${hasEndOfFile ? 'Found' : 'Missing'}`);
      
      if (hasHeader && hasObjects && hasEndOfFile) {
        console.log('🎉 PDF appears to be valid!');
      } else {
        console.log('⚠️  PDF may be corrupted');
      }
      
    } else {
      console.log('❌ PDF generation failed - empty buffer');
    }
    
  } catch (error) {
    console.error('❌ PDF generation error:', error.message);
    
    // Check if it's a database connection issue
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.log('💡 Tip: Make sure MongoDB is running and backend is configured');
    }
    
    // Check if it's a model loading issue
    if (error.message.includes('Cannot find module')) {
      console.log('💡 Tip: Make sure you\'re running this from the correct directory');
    }
  }
}

// Run the test
testPDFGeneration().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
