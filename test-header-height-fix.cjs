const mongoose = require('mongoose');

// Test database connection and PDF generation with header height fix
async function testHeaderHeightFix() {
  try {
    console.log('🧪 Testing Header Height Fix for BCT 5 AB...');

    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/routineDB', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 5000,
    });

    console.log('✅ Database connected successfully');

    // Import models
    const TimeSlotDefinition = require('./backend/models/TimeSlotDefinition');
    const RoutineSlot = require('./backend/models/RoutineSlot');
    const PDFRoutineService = require('./backend/services/PDFRoutineService');

    // Test data fetch
    console.log('📊 Fetching time slots...');
    const timeSlots = await TimeSlotDefinition.find({}).sort({ sortOrder: 1 }).limit(5);
    console.log(`Found ${timeSlots.length} time slots`);

    console.log('📋 Fetching routine slots for BCT 5 AB...');
    const routineSlots = await RoutineSlot.find({
      programCode: 'BCT',
      semester: 5,
      section: 'AB'
    }).limit(10);
    console.log(`Found ${routineSlots.length} routine slots`);

    if (routineSlots.length > 0) {
      console.log('🔍 Sample routine slot:', {
        dayIndex: routineSlots[0].dayIndex,
        slotIndex: routineSlots[0].slotIndex,
        subjectCode: routineSlots[0].subjectCode_display,
        classType: routineSlots[0].classType
      });

      // Test PDF generation
      console.log('📄 Testing PDF generation with header height fix...');
      const pdfService = new PDFRoutineService();
      
      // Check if headerRowHeight is set
      console.log('📏 Header row height:', pdfService.headerRowHeight);
      
      // Generate PDF buffer
      const pdfBuffer = await pdfService.generateClassRoutinePDF('BCT', 5, 'AB');
      console.log(`✅ PDF generated successfully! Size: ${pdfBuffer.length} bytes`);
      
      // Save test PDF
      const fs = require('fs');
      fs.writeFileSync('./test_header_height_fix.pdf', pdfBuffer);
      console.log('💾 Test PDF saved as test_header_height_fix.pdf');

    } else {
      console.log('⚠️ No routine slots found for BCT 5 AB');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
}

// Run test
testHeaderHeightFix().then(() => {
  console.log('🏁 Header height fix test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
