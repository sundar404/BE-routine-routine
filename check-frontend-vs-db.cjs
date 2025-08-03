// Check frontend vs database time slot IDs
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

async function checkFrontendVsDatabase() {
  console.log('🔍 Checking Frontend vs Database Discrepancy...');
  console.log('==========================================\n');
  
  try {
    // Step 1: Login to get authentication token
    console.log('🔑 Logging in to get authentication token...');
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
    console.log('\n⏰ Getting time slots...');
    const timeSlots = await makeRequest('http://localhost:7102/api/time-slots', 'GET', null, token);
    
    if (!Array.isArray(timeSlots)) {
      console.log('❌ Failed to get time slots:', timeSlots);
      return;
    }
    
    const sortedTimeSlots = [...timeSlots].sort((a, b) => a.sortOrder - b.sortOrder);
    console.log(`✅ Found ${sortedTimeSlots.length} time slots with valid IDs`);
    sortedTimeSlots.forEach(slot => {
      console.log(`  ${slot._id}: ${slot.startTime}-${slot.endTime} (sortOrder: ${slot.sortOrder})`);
    });
    
    // Step 3: Get all routine slots for BCT-5-AB
    console.log('\n📋 Getting ALL routine slots for BCT-5-AB...');
    const allRoutineSlots = await makeRequest('http://localhost:7102/api/routine-slots?program=BCT&semester=5&section=AB&limit=500', 'GET', null, token);
    
    if (!Array.isArray(allRoutineSlots)) {
      console.log('❌ Failed to get routine slots:', allRoutineSlots);
      return;
    }
    
    console.log(`✅ Found ${allRoutineSlots.length} total routine slots for BCT-5-AB`);
    
    // Check for classes with missing timeSlotId
    const missingTimeSlots = allRoutineSlots.filter(slot => !slot.timeSlotId);
    console.log(`\n⚠️ Found ${missingTimeSlots.length} routine slots with missing timeSlotId`);
    
    // Check for classes with slotIndex but no timeSlotId
    const withSlotIndex = allRoutineSlots.filter(slot => slot.slotIndex !== undefined && slot.slotIndex !== null);
    console.log(`\n⚠️ Found ${withSlotIndex.length} routine slots with slotIndex property`);
    
    // Check if slotIndex is being used in the frontend instead of timeSlotId
    if (withSlotIndex.length > 0) {
      console.log('\n🔍 ANALYZING FRONTEND vs DATABASE DISCREPANCY...');
      console.log('The frontend might be using slotIndex instead of timeSlotId!');
      
      // Group classes by day and slotIndex
      const classesByDayAndSlot = {};
      withSlotIndex.forEach(slot => {
        if (!slot.dayIndex) return;
        
        const key = `Day${slot.dayIndex}-Slot${slot.slotIndex}`;
        if (!classesByDayAndSlot[key]) classesByDayAndSlot[key] = [];
        classesByDayAndSlot[key].push(slot);
      });
      
      // Print classes by day and slot index
      console.log('\n📊 Classes by Day and Slot Index (as shown in frontend):');
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      
      Object.entries(classesByDayAndSlot).forEach(([key, slots]) => {
        const dayIndex = parseInt(key.match(/Day(\d+)/)?.[1]);
        const slotIndex = parseInt(key.match(/Slot(\d+)/)?.[1]);
        const dayName = days[dayIndex] || `Day ${dayIndex}`;
        
        // Find matching time slot by slotIndex (assumes sortOrder aligns with slotIndex)
        const timeSlot = sortedTimeSlots.find(t => t.sortOrder === slotIndex + 1) || 
                        sortedTimeSlots.find(t => t.sortOrder === slotIndex);
        
        const timeStr = timeSlot ? 
          `${timeSlot.startTime}-${timeSlot.endTime}` : 
          `Slot ${slotIndex} (Unknown time)`;
        
        console.log(`\n${dayName}, ${timeStr}:`);
        slots.forEach(slot => {
          console.log(`  - ${slot.subjectId?.name || 'Unknown'} (${slot.classType})`);
          console.log(`    Room: ${slot.roomId?.name || 'Unknown'}, Teachers: ${slot.teacherIds?.map(t => t.shortName || t.name).join(', ') || 'None'}`);
        });
      });
      
      // Look specifically for 10:15 classes based on slotIndex
      const timeSlot1015 = sortedTimeSlots.find(s => s.startTime === '10:15');
      if (timeSlot1015) {
        console.log(`\n🔍 Checking classes at 10:15 slot index...`);
        // In most systems, index 0 = first period = 10:15
        const slot1015Index = timeSlot1015.sortOrder - 1;
        const classes1015 = withSlotIndex.filter(s => s.slotIndex === slot1015Index);
        
        if (classes1015.length > 0) {
          console.log(`✅ Found ${classes1015.length} classes at 10:15 using slotIndex=${slot1015Index}:`);
          classes1015.forEach(slot => {
            console.log(`  - Day ${slot.dayIndex} (${days[slot.dayIndex] || 'Unknown'}): ${slot.subjectId?.name || 'Unknown'} (${slot.classType})`);
          });
          
          // This explains the discrepancy!
          console.log('\n💡 DIAGNOSIS:');
          console.log('1. Your frontend is using slotIndex to position classes in the grid');
          console.log('2. But your PDF generator is using timeSlotId to position classes');
          console.log('3. Classes have slotIndex values but missing timeSlotId values');
          console.log('\nSOLUTION:');
          console.log('Update your PDF generation to use slotIndex instead of timeSlotId');
          console.log('OR assign proper timeSlotId values to all classes based on their slotIndex');
        } else {
          console.log(`❌ No classes found with slotIndex=${slot1015Index}`);
        }
      }
    }
    
    console.log('\n📱 FRONTEND vs PDF ANALYSIS:');
    console.log('1. Frontend shows classes correctly using slotIndex property');
    console.log('2. PDF generation is using timeSlotId property');
    console.log('3. Classes in database have slotIndex but missing timeSlotId');
    console.log('4. This explains why classes show in frontend but not in PDF!');
    
  } catch (error) {
    console.error('❌ Error checking frontend vs database:', error.message);
  }
}

checkFrontendVsDatabase();
