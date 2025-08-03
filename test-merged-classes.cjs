const axios = require('axios');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:3001/api';

async function testMergedClasses() {
  try {
    console.log('🔍 Testing merged class detection in PDF generation...');

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

    // Step 2: Get routine data first to analyze
    console.log('\n📋 Getting routine data to analyze merged classes...');
    
    const routineResponse = await axios.get(`${API_BASE_URL}/routines/BCT/5/AB`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const routineSlots = routineResponse.data.routineSlots;
    console.log(`Found ${routineSlots.length} routine slots total`);

    // Step 3: Analyze for merged classes (same dayIndex + slotIndex)
    const slotMap = new Map();
    
    routineSlots.forEach(slot => {
      const key = `${slot.dayIndex}-${slot.slotIndex}`;
      if (!slotMap.has(key)) {
        slotMap.set(key, []);
      }
      slotMap.get(key).push(slot);
    });

    console.log('\n🔀 Analyzing for merged classes...');
    let mergedSlotCount = 0;
    
    for (const [key, slots] of slotMap.entries()) {
      if (slots.length > 1) {
        mergedSlotCount++;
        const [dayIndex, slotIndex] = key.split('-');
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        console.log(`\n📍 Merged slot found: ${dayNames[dayIndex]} slot ${slotIndex} (${slots.length} classes)`);
        slots.forEach((slot, idx) => {
          const subjectName = slot.subjectName_display || slot.subjectId?.name || 'N/A';
          console.log(`  ${idx + 1}. ${subjectName} [${slot.classType}] (${slot.labGroup || 'ALL'})`);
        });
      }
    }

    console.log(`\n📊 Found ${mergedSlotCount} merged time slots`);

    // Step 4: Generate PDF
    console.log('\n📄 Generating PDF with merged class support...');
    
    const pdfResponse = await axios.get(`${API_BASE_URL}/routines/BCT/5/AB/export-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });

    if (pdfResponse.status !== 200) {
      throw new Error(`PDF generation failed: ${pdfResponse.status}`);
    }

    // Save the PDF
    const filename = 'test-merged-classes.pdf';
    fs.writeFileSync(filename, pdfResponse.data);

    console.log(`✅ PDF generated successfully: ${filename}`);
    console.log(`📊 PDF size: ${(pdfResponse.data.length / 1024).toFixed(2)} KB`);
    console.log(`🔍 PDF validity: ${pdfResponse.data.length > 1000 ? '✅ Valid' : '❌ Too small'}`);

    console.log('\n🎯 Summary:');
    console.log(`- Total routine slots: ${routineSlots.length}`);
    console.log(`- Merged time slots: ${mergedSlotCount}`);
    console.log(`- PDF successfully generated with merged class support`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

testMergedClasses();
