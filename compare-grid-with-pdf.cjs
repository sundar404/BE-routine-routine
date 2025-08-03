// Fix PDF routine export
const http = require('http');

async function makeRequest(url, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      options.headers['x-auth-token'] = token;
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request(url, options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Get grid data directly from frontend API to compare with PDF generation
 */
async function compareGridWithPDF() {
  console.log('🔍 Comparing Frontend Grid with PDF Generation...');
  console.log('==============================================\n');
  
  try {
    // Step 1: Login to get authentication token
    console.log('🔑 Logging in...');
    const loginData = {
      email: 'admin@ioe.edu.np',
      password: 'admin123'
    };
    
    const loginResponse = await makeRequest('http://localhost:7102/api/auth/login', 'POST', loginData);
    
    if (!loginResponse.token) {
      console.log('❌ Login failed:', loginResponse);
      return;
    }
    
    console.log('✅ Login successful!');
    const token = loginResponse.token;
    
    // Step 2: Get time slots
    console.log('\n⏰ Getting time slots from API...');
    const timeSlots = await makeRequest('http://localhost:7102/api/time-slots', 'GET', null, token);
    
    if (!Array.isArray(timeSlots)) {
      console.log('❌ Failed to get time slots:', timeSlots);
      return;
    }
    
    console.log(`✅ Found ${timeSlots.length} time slots`);
    
    // Step 3: Get frontend grid data for BCT-5-AB
    console.log('\n📊 Getting frontend grid data for BCT-5-AB...');
    
    // This would typically be an API endpoint that returns the frontend grid data
    // Since we don't have direct access, we'll build it from routine slots similar to frontend
    
    const routineSlots = await makeRequest(
      'http://localhost:7102/api/routine-slots?program=BCT&semester=5&section=AB',
      'GET', 
      null, 
      token
    );
    
    if (!Array.isArray(routineSlots)) {
      console.log('❌ Failed to get routine slots:', routineSlots);
      return;
    }
    
    console.log(`✅ Found ${routineSlots.length} routine slots for BCT-5-AB`);
    
    // Step 4: Analyze PDF generation logic vs frontend display
    console.log('\n🔬 Analyzing PDF vs Frontend display logic...');
    
    // Create a grid structure similar to the frontend
    const frontendGrid = {};
    
    // Group by day and slot index
    routineSlots.forEach(slot => {
      const dayIndex = slot.dayIndex;
      const slotIndex = slot.slotIndex;
      
      if (!frontendGrid[dayIndex]) {
        frontendGrid[dayIndex] = {};
      }
      
      if (!frontendGrid[dayIndex][slotIndex]) {
        frontendGrid[dayIndex][slotIndex] = [];
      }
      
      frontendGrid[dayIndex][slotIndex].push(slot);
    });
    
    // Print the frontend grid structure
    console.log('\n📊 Frontend Grid Structure:');
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    let foundClasses = false;
    
    Object.keys(frontendGrid).sort().forEach(dayIndex => {
      console.log(`\n${days[dayIndex] || `Day ${dayIndex}`}:`);
      
      const sortedSlotIndices = Object.keys(frontendGrid[dayIndex]).sort((a, b) => parseInt(a) - parseInt(b));
      
      sortedSlotIndices.forEach(slotIndex => {
        const slots = frontendGrid[dayIndex][slotIndex];
        const timeSlot = timeSlots.find(ts => ts.sortOrder === parseInt(slotIndex) + 1);
        const timeRange = timeSlot ? `${timeSlot.startTime}-${timeSlot.endTime}` : `Slot ${slotIndex}`;
        
        console.log(`  ${timeRange} (slotIndex: ${slotIndex}):`);
        
        if (slots.length === 0) {
          console.log('    - Empty');
        } else if (slots.length === 1) {
          const slot = slots[0];
          console.log(`    - ${slot.subjectId?.name || 'N/A'} (${slot.classType}) - Room: ${slot.roomId?.name || 'N/A'}`);
          foundClasses = true;
        } else {
          console.log(`    - MULTI GROUP CLASS (${slots.length} groups):`);
          slots.forEach(slot => {
            console.log(`      • ${slot.subjectId?.name || 'N/A'} (${slot.classType}) - Room: ${slot.roomId?.name || 'N/A'}`);
          });
          foundClasses = true;
        }
      });
    });
    
    if (!foundClasses) {
      console.log('\n❌ No classes found in frontend grid. This could be a serious issue.');
    }
    
    // Step 5: Compare PDF generation mapping logic
    console.log('\n🔄 Checking PDF Generation mapping logic...');
    
    console.log('\nTime Slots sorting and mapping:');
    timeSlots.forEach((slot, idx) => {
      console.log(`  ${idx}: ${slot.startTime}-${slot.endTime} (sortOrder: ${slot.sortOrder}, _id: ${slot._id})`);
    });
    
    // Create slotIndex to timeSlotId mapping as in PDF generation
    const slotIndexToTimeSlotId = {};
    
    timeSlots.forEach(timeSlot => {
      const index = timeSlot.sortOrder - 1;
      slotIndexToTimeSlotId[index] = timeSlot._id;
    });
    
    console.log('\nSlotIndex to TimeSlotId mapping:');
    Object.keys(slotIndexToTimeSlotId).forEach(slotIndex => {
      const timeSlot = timeSlots.find(ts => ts._id === slotIndexToTimeSlotId[slotIndex]);
      const timeRange = timeSlot ? `${timeSlot.startTime}-${timeSlot.endTime}` : 'Unknown';
      console.log(`  slotIndex ${slotIndex} -> timeSlotId ${slotIndexToTimeSlotId[slotIndex]} (${timeRange})`);
    });
    
    // Step 6: Check for class data at slotIndex 0 (10:15-11:05)
    const slot0Classes = routineSlots.filter(slot => slot.slotIndex === 0);
    console.log(`\n🔍 Classes with slotIndex=0 (10:15-11:05): ${slot0Classes.length}`);
    
    if (slot0Classes.length > 0) {
      console.log('  Classes found at 10:15-11:05:');
      slot0Classes.forEach(slot => {
        console.log(`    - Day ${slot.dayIndex} (${days[slot.dayIndex]}): ${slot.subjectId?.name || 'N/A'} (${slot.classType})`);
      });
    } else {
      console.log('  No classes assigned to 10:15-11:05 - This matches the empty column in the PDF!');
    }
    
    // Step 7: Check for [BREAK] entries
    console.log('\n🔍 Checking for [BREAK] entries...');
    
    // Check if any time slots are marked as breaks
    const breakTimeSlots = timeSlots.filter(ts => ts.isBreak);
    console.log(`Found ${breakTimeSlots.length} time slots marked with isBreak=true:`);
    
    if (breakTimeSlots.length > 0) {
      breakTimeSlots.forEach(ts => {
        console.log(`  - ${ts.startTime}-${ts.endTime} (sortOrder: ${ts.sortOrder})`);
      });
    }
    
    // Check if any routine slots have "BREAK" type
    const breakSlots = routineSlots.filter(slot => slot.classType === 'BREAK');
    console.log(`Found ${breakSlots.length} routine slots with classType='BREAK'`);
    
    // Step 8: Check for multi-group classes
    console.log('\n🔍 Analyzing multi-group classes...');
    
    // Count how many slot indices have multiple classes
    const multiGroupIndices = {};
    
    routineSlots.forEach(slot => {
      const key = `${slot.dayIndex}-${slot.slotIndex}`;
      if (!multiGroupIndices[key]) {
        multiGroupIndices[key] = 0;
      }
      multiGroupIndices[key]++;
    });
    
    // Find all keys with count > 1 (multi-group)
    const multiGroupKeys = Object.keys(multiGroupIndices).filter(key => multiGroupIndices[key] > 1);
    
    console.log(`Found ${multiGroupKeys.length} potential multi-group class slots:`);
    
    if (multiGroupKeys.length > 0) {
      multiGroupKeys.forEach(key => {
        const [dayIndex, slotIndex] = key.split('-');
        console.log(`  - Day ${dayIndex} (${days[dayIndex]}), Slot ${slotIndex}: ${multiGroupIndices[key]} classes`);
        
        // Get the actual classes
        const classes = routineSlots.filter(
          slot => slot.dayIndex.toString() === dayIndex && slot.slotIndex.toString() === slotIndex
        );
        
        classes.forEach(slot => {
          console.log(`    • ${slot.subjectId?.name || 'N/A'} (${slot.classType}) - Room: ${slot.roomId?.name || 'N/A'}`);
        });
      });
    } else {
      console.log('  No multi-group classes found');
    }
    
    // Final diagnosis and recommendations
    console.log('\n📋 DIAGNOSIS AND RECOMMENDATIONS:');
    console.log('1. The 10:15-11:05 column is empty because there are no classes with slotIndex=0');
    
    if (breakTimeSlots.length > 0) {
      console.log('2. [BREAK] entries appear because some time slots are marked with isBreak=true');
      console.log('   - Check if this matches your frontend display');
    }
    
    if (multiGroupKeys.length > 0) {
      console.log('3. Multi-group classes exist but might not be merging correctly in PDF');
      console.log('   - Ensure the PDF generator properly identifies and merges these classes');
    }
    
    console.log('\nRECOMMENDED FIXES:');
    console.log('1. Update PDF generator to structure grid exactly like frontend (by slotIndex)');
    console.log('2. Ensure break slots are handled consistently between frontend and PDF');
    console.log('3. Verify multi-group class merging logic matches frontend behavior');
    
  } catch (error) {
    console.error('❌ Error comparing frontend grid with PDF:', error.message);
  }
}

compareGridWithPDF();
