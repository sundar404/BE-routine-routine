// Check all routine slots at 10:15 across all programs and sections
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

async function checkSlotTiming() {
  console.log('🔍 Checking For ALL Classes at 10:15 Across ALL Programs...');
  console.log('======================================================\n');
  
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
    
    // Step 2: Check time slots (just to confirm they exist)
    console.log('\n⏰ Checking Time Slots...');
    const timeSlots = await makeRequest('http://localhost:7102/api/time-slots', 'GET', null, token);
    
    if (!Array.isArray(timeSlots)) {
      console.log('❌ Failed to get time slots:', timeSlots);
      return;
    }
    
    const slot1015 = timeSlots.find(s => s.startTime === '10:15');
    if (!slot1015) {
      console.log('❌ 10:15 time slot not found!');
      return;
    }
    
    console.log(`✅ Found 10:15-11:05 time slot with ID: ${slot1015._id}`);
    
    // Step 3: Get ALL routine slots (no filtering)
    console.log('\n📋 Checking ALL routine slots in the system...');
    const allSlots = await makeRequest('http://localhost:7102/api/routine-slots?limit=1000', 'GET', null, token);
    
    if (!Array.isArray(allSlots)) {
      console.log('❌ Failed to get routine slots:', allSlots);
      return;
    }
    
    console.log(`✅ Found ${allSlots.length} total routine slots in the system`);
    
    // Find all slots with time slot ID matching 10:15
    const slots1015 = allSlots.filter(slot => 
      slot.timeSlotId && slot.timeSlotId.toString() === slot1015._id.toString()
    );
    
    if (slots1015.length > 0) {
      console.log(`\n✅ Found ${slots1015.length} classes assigned to 10:15-11:05 time slot:`);
      
      // Group by program/section
      const byProgram = {};
      slots1015.forEach(slot => {
        const key = `${slot.programCode}-${slot.semester}${slot.section}`;
        if (!byProgram[key]) byProgram[key] = [];
        byProgram[key].push(slot);
      });
      
      // Print each program's classes at 10:15
      Object.entries(byProgram).sort().forEach(([program, slots]) => {
        console.log(`\n${program}:`);
        
        // Group by day
        const byDay = {};
        slots.forEach(slot => {
          if (!byDay[slot.dayIndex]) byDay[slot.dayIndex] = [];
          byDay[slot.dayIndex].push(slot);
        });
        
        // Days of week
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        // Print each day's classes
        Object.entries(byDay).sort().forEach(([dayIndex, slots]) => {
          console.log(`  ${days[dayIndex] || `Day ${dayIndex}`}:`);
          slots.forEach(slot => {
            console.log(`    - ${slot.subjectId?.name || 'Unknown'} (${slot.classType}) - Room: ${slot.roomId?.name || 'Unknown'}`);
          });
        });
      });
      
      // Check specifically for BCT-5-AB
      const bct5abSlots = slots1015.filter(slot => 
        slot.programCode === 'BCT' && slot.semester === 5 && slot.section === 'AB'
      );
      
      if (bct5abSlots.length > 0) {
        console.log('\n✅ BCT-5-AB has classes at 10:15!');
        bct5abSlots.forEach(slot => {
          const day = days[slot.dayIndex] || `Day ${slot.dayIndex}`;
          console.log(`  - ${day}: ${slot.subjectId?.name || 'Unknown'} (${slot.classType})`);
        });
      } else {
        console.log('\n❌ BCT-5-AB has NO classes at 10:15!');
      }
      
    } else {
      console.log('\n❌ NO classes found assigned to 10:15-11:05 anywhere in the system!');
      console.log('The 10:15 column is empty because no classes are assigned to this time.');
      
      // Check for slots with undefined time IDs
      const undefinedTimeSlots = allSlots.filter(slot => !slot.timeSlotId);
      console.log(`\n⚠️ Found ${undefinedTimeSlots.length} routine slots with undefined/null timeSlotId.`);
      
      if (undefinedTimeSlots.length > 0) {
        console.log('\nSample classes with missing time slot IDs:');
        undefinedTimeSlots.slice(0, 5).forEach(slot => {
          console.log(`  - ${slot.subjectId?.name || 'Unknown'} (${slot.programCode}-${slot.semester}${slot.section})`);
        });
        
        // Check if any are for BCT-5-AB
        const bct5abUndefined = undefinedTimeSlots.filter(slot => 
          slot.programCode === 'BCT' && slot.semester === 5 && slot.section === 'AB'
        );
        
        if (bct5abUndefined.length > 0) {
          console.log(`\n⚠️ Found ${bct5abUndefined.length} BCT-5-AB classes with undefined time slot IDs!`);
          console.log('These classes are in the database but don\'t show in the correct time column because they lack a proper timeSlotId.');
        }
      }
    }
    
    console.log('\n💡 PDF GENERATION DIAGNOSIS:');
    console.log('1. The PDF shows time slots correctly from the database');
    console.log('2. Classes are only shown in time slots they\'re explicitly assigned to');
    console.log('3. Classes without a valid timeSlotId will not appear in the PDF');
    
  } catch (error) {
    console.error('❌ Error checking for 10:15 classes:', error.message);
  }
}

checkSlotTiming();
