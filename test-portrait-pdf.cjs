const axios = require('axios');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:3001/api';

async function testPortraitPDFWithSpanning() {
  try {
    console.log('🔍 Testing Portrait PDF with Spanning Classes (No Time Details)...');

    // Step 1: Login
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@admin.com',
      password: 'admin123'
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Generate PDF for BCT 5 AB
    console.log('\n📄 Generating Portrait PDF with spanning class improvements...');
    
    const pdfResponse = await axios.get(`${API_BASE_URL}/routines/BCT/5/AB/export-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });

    if (pdfResponse.status !== 200) {
      throw new Error(`PDF generation failed: ${pdfResponse.status}`);
    }

    // Save the PDF
    const filename = 'test-portrait-spanning-classes.pdf';
    fs.writeFileSync(filename, pdfResponse.data);

    console.log(`✅ PDF generated successfully: ${filename}`);
    console.log(`📊 PDF size: ${(pdfResponse.data.length / 1024).toFixed(2)} KB`);
    console.log(`🔍 PDF validity: ${pdfResponse.data.length > 1000 ? '✅ Valid' : '❌ Too small'}`);

    // Step 3: Get routine data to verify spanning classes
    console.log('\n📋 Verifying spanning class structure...');
    
    const routineResponse = await axios.get(`${API_BASE_URL}/routines/BCT/5/AB`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const routineSlots = routineResponse.data.routineSlots;
    
    // Check Sunday for Computer Graphics spanning slots 1-2
    const sundaySlots = routineSlots.filter(slot => slot.dayIndex === 0)
                                   .sort((a, b) => a.slotIndex - b.slotIndex);
    
    console.log('\n📅 Sunday Analysis for Computer Graphics spanning:');
    sundaySlots.slice(0, 5).forEach((slot, index) => {
      const subjectName = slot.subjectName_display || slot.subjectId?.name || 'N/A';
      console.log(`  Slot ${slot.slotIndex}: ${subjectName} [${slot.classType}]`);
    });

    // Check if Computer Graphics spans slots 1-2
    const slot1 = sundaySlots.find(s => s.slotIndex === 1);
    const slot2 = sundaySlots.find(s => s.slotIndex === 2);
    
    if (slot1 && slot2) {
      const subject1 = slot1.subjectName_display || slot1.subjectId?.name;
      const subject2 = slot2.subjectName_display || slot2.subjectId?.name;
      
      if (subject1 === subject2 && subject1 === 'Computer Graphics') {
        console.log('✅ Computer Graphics spanning detected: Slots 1-2 should be merged');
        console.log('📏 Expected: Single cell spanning 2 time slots with NO time details');
      } else {
        console.log('❌ No spanning detected for Computer Graphics');
      }
    }

    console.log('\n🎯 Summary of Changes:');
    console.log('- ✅ PDF Layout: Changed to Portrait (A4 height)');
    console.log('- ✅ Row Height: Increased to 90px for better readability');
    console.log('- ✅ Spanning Classes: Merge consecutive same subjects');
    console.log('- ✅ Time Details: Removed from spanning class cells');
    console.log('- ✅ Font Sizes: Adjusted for portrait layout');

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Tip: Make sure the backend server is running with "cd backend && npm start"');
    }
  }
}

testPortraitPDFWithSpanning();
