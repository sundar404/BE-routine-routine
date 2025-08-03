const axios = require('axios');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:3001/api';

async function testSpanningClasses() {
  try {
    console.log('🔍 Testing spanning class detection in PDF generation...');

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

    // Step 2: Get routine data to analyze spanning patterns
    console.log('\n📋 Getting routine data to analyze spanning classes...');
    
    const routineResponse = await axios.get(`${API_BASE_URL}/routines/BCT/5/AB`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const routineSlots = routineResponse.data.routineSlots;
    console.log(`Found ${routineSlots.length} routine slots total`);

    // Step 3: Analyze for spanning classes by day
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    days.forEach((day, dayIndex) => {
      const daySlots = routineSlots.filter(slot => slot.dayIndex === dayIndex)
                                   .sort((a, b) => a.slotIndex - b.slotIndex);
      
      if (daySlots.length === 0) return;
      
      console.log(`\n📅 ${day} Analysis:`);
      console.log('Slots by time order:');
      
      daySlots.forEach((slot, index) => {
        const subjectName = slot.subjectName_display || slot.subjectId?.name || 'N/A';
        console.log(`  ${slot.slotIndex}. ${subjectName} [${slot.classType}] ${slot.labGroup ? '('+slot.labGroup+')' : ''}`);
      });
      
      // Detect spanning patterns
      let currentSpan = null;
      const spans = [];
      
      daySlots.forEach((slot, index) => {
        if (slot.classType === 'BREAK') {
          if (currentSpan) {
            spans.push(currentSpan);
            currentSpan = null;
          }
          return;
        }
        
        const subjectIdentifier = slot.subjectId?.code || slot.subjectCode_display || slot.subjectName_display || 'N/A';
        
        if (!currentSpan) {
          currentSpan = {
            startSlot: slot.slotIndex,
            endSlot: slot.slotIndex,
            subject: subjectIdentifier,
            classType: slot.classType,
            slots: [slot]
          };
        } else if (currentSpan.subject === subjectIdentifier && 
                   currentSpan.classType === slot.classType &&
                   slot.slotIndex === currentSpan.endSlot + 1) {
          currentSpan.endSlot = slot.slotIndex;
          currentSpan.slots.push(slot);
        } else {
          spans.push(currentSpan);
          currentSpan = {
            startSlot: slot.slotIndex,
            endSlot: slot.slotIndex,
            subject: subjectIdentifier,
            classType: slot.classType,
            slots: [slot]
          };
        }
        
        if (index === daySlots.length - 1 && currentSpan) {
          spans.push(currentSpan);
        }
      });
      
      const spanningClasses = spans.filter(span => span.endSlot > span.startSlot);
      
      if (spanningClasses.length > 0) {
        console.log(`📏 Spanning classes detected:`);
        spanningClasses.forEach(span => {
          console.log(`  → ${span.subject} [${span.classType}] spans slots ${span.startSlot}-${span.endSlot} (${span.endSlot - span.startSlot + 1} periods)`);
        });
      } else {
        console.log('📏 No spanning classes found');
      }
    });

    // Step 4: Generate PDF with spanning class support
    console.log('\n📄 Generating PDF with spanning class support...');
    
    const pdfResponse = await axios.get(`${API_BASE_URL}/routines/BCT/5/AB/export-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });

    if (pdfResponse.status !== 200) {
      throw new Error(`PDF generation failed: ${pdfResponse.status}`);
    }

    // Save the PDF
    const filename = 'test-spanning-classes.pdf';
    fs.writeFileSync(filename, pdfResponse.data);

    console.log(`\n✅ PDF generated successfully: ${filename}`);
    console.log(`📊 PDF size: ${(pdfResponse.data.length / 1024).toFixed(2)} KB`);
    console.log(`🔍 PDF validity: ${pdfResponse.data.length > 1000 ? '✅ Valid' : '❌ Too small'}`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

testSpanningClasses();
