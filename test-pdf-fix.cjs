const PDFRoutineService = require('./backend/services/PDFRoutineService');
const fs = require('fs');

// Test PDF generation with debug output
async function testPDFGeneration() {
  console.log('🧪 Testing PDF generation with fixes...');
  
  const pdfService = new PDFRoutineService();
  
  try {
    // Test with BCT 5 AB as shown in the image
    const pdfBuffer = await pdfService.generateClassSchedulePDF('BCT', 5, 'AB');
    
    if (pdfBuffer) {
      // Save to file for inspection
      fs.writeFileSync('./test-routine-fixed.pdf', pdfBuffer);
      console.log('✅ PDF generated successfully: test-routine-fixed.pdf');
      console.log(`📊 PDF size: ${pdfBuffer.length} bytes`);
    } else {
      console.log('❌ PDF generation returned null');
    }
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Mock database connection if needed
const mongoose = require('mongoose');

async function runTest() {
  try {
    // If MongoDB is available, connect
    await mongoose.connect('mongodb://localhost:27017/routine_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('📄 Connected to MongoDB');
    
    await testPDFGeneration();
    
  } catch (connectionError) {
    console.log('⚠️ MongoDB not available, skipping test');
    console.log('Connection error:', connectionError.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

runTest();
