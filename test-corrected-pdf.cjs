// Test the updated PDF generation with corrected slotIndex mapping
const mongoose = require('mongoose');
const PDFRoutineService = require('./backend/services/PDFRoutineService');
const fs = require('fs');

async function testPDFGeneration() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/routine_management');
    console.log('📄 Connected to MongoDB');
    
    const pdfService = new PDFRoutineService();
    
    console.log('🧪 Testing PDF generation with corrected slotIndex mapping...');
    
    // Generate PDF for BCT 5 AB
    const pdfBuffer = await pdfService.generateClassSchedulePDF('BCT', 5, 'AB');
    
    if (pdfBuffer) {
      // Save to file
      fs.writeFileSync('./test-routine-fixed.pdf', pdfBuffer);
      console.log('✅ PDF generated successfully: test-routine-fixed.pdf');
      console.log(`📊 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    } else {
      console.log('❌ PDF generation returned null');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 MongoDB is not running. Please start MongoDB first.');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

testPDFGeneration();
