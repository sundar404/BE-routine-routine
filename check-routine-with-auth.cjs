// Check routine data via backend API with authentication
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
      // Try both header formats
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

async function checkRoutineDataWithAuth() {
  console.log('🔍 Checking Routine Data via Backend API (with auth)...');
  console.log('===================================================\n');
  
  try {
    // Step 1: Login to get authentication token
    console.log('🔑 Logging in to get authentication token...');
    const loginData = {
      email: 'admin@ioe.edu.np',  // Default admin credentials
      password: 'admin123'               // Default admin password
    };
    
    const loginResponse = await makeRequest('http://localhost:7102/api/auth/login', 'POST', loginData);
    
    if (!loginResponse.token) {
      console.log('❌ Login failed:', loginResponse);
      console.log('\nTry with:');
      console.log('1. email: admin@bctroutine.com, password: admin');
      console.log('2. OR any other admin account you created');
      return;
    }
    
    console.log('✅ Login successful!');
    const token = loginResponse.token;
    
    // Step 2: Check time slots (just to confirm they exist)
    console.log('\n⏰ Checking Time Slots...');
    const timeSlots = await makeRequest('http://localhost:7102/api/time-slots', 'GET', null, token);
    
    if (Array.isArray(timeSlots)) {
      console.log(`✅ Found ${timeSlots.length} time slots:`);
      const sortedSlots = [...timeSlots].sort((a, b) => a.sortOrder - b.sortOrder);
      sortedSlots.forEach(slot => {
        console.log(`  ${slot._id}: ${slot.startTime}-${slot.endTime} (sortOrder: ${slot.sortOrder})`);
      });
    } else {
      console.log('❌ Failed to get time slots:', timeSlots);
    }
    
    // Step 3: Check routine slots with authentication
    console.log('\n📋 Checking Routine Slots for BCT-5-AB (with auth)...');
    const routineSlots = await makeRequest('http://localhost:7102/api/routine-slots?program=BCT&semester=5&section=AB', 'GET', null, token);
    
    // Also check BCT-5-1B
    console.log('\n📋 Checking Routine Slots for BCT-5-1B (with auth)...');
    const routineSlots1B = await makeRequest('http://localhost:7102/api/routine-slots?program=BCT&semester=5&section=1B', 'GET', null, token);
    
    if (Array.isArray(routineSlots)) {
      console.log(`✅ Found ${routineSlots.length} routine slots for BCT-5-AB`);
      
      if (routineSlots.length === 0) {
        console.log('\n❌ NO ROUTINE SLOTS FOUND for BCT-5-AB!');
        console.log('This is why your PDF is showing empty slots.');
      } else {
        // Group by day and time slot
        const slotsByDay = {};
        routineSlots.forEach(slot => {
          if (!slotsByDay[slot.dayIndex]) {
            slotsByDay[slot.dayIndex] = {};
          }
          
          // For multi-slots, this might override, which is fine for our check
          slotsByDay[slot.dayIndex][slot.slotId] = slot;
        });
        
        // Check if 10:15 slot has any classes
        const timeSlot1015 = timeSlots.find(s => s.startTime === '10:15');
        if (timeSlot1015) {
          console.log(`\n🔍 Checking specifically for 10:15 slot (ID: ${timeSlot1015._id})...`);
          
          let found = false;
          for (const day in slotsByDay) {
            if (slotsByDay[day][timeSlot1015._id]) {
              const slot = slotsByDay[day][timeSlot1015._id];
              console.log(`✅ Found class on day ${day} at 10:15: ${slot.subjectId?.name || 'Unknown'}`);
              found = true;
            }
          }
          
          if (!found) {
            console.log('❌ NO CLASSES SCHEDULED at 10:15 for BCT-5-AB!');
            console.log('This is why your 10:15 column appears empty.');
          }
        }
        
        // Check for multi-groups
        console.log('\n🔍 Checking for multi-group classes...');
        const multiGroupSlots = routineSlots.filter(slot => 
          routineSlots.some(other => 
            other.dayIndex === slot.dayIndex && 
            other.slotId === slot.slotId && 
            other._id !== slot._id
          )
        );
        
        if (multiGroupSlots.length > 0) {
          console.log(`✅ Found ${multiGroupSlots.length} slots that should be merged as multi-group classes:`);
          
          const groupedByDayAndSlot = {};
          multiGroupSlots.forEach(slot => {
            const key = `Day${slot.dayIndex}-Slot${slot.slotId}`;
            if (!groupedByDayAndSlot[key]) {
              groupedByDayAndSlot[key] = [];
            }
            groupedByDayAndSlot[key].push(slot);
          });
          
          Object.entries(groupedByDayAndSlot).forEach(([key, slots]) => {
            console.log(`  ${key}: ${slots.map(s => s.subjectId?.name || 'Unknown').join(', ')}`);
          });
        } else {
          console.log('❌ NO MULTI-GROUP CLASSES FOUND!');
        }
      }
    } else {
      console.log('❌ Failed to get routine slots:', routineSlots);
    }
    
  } catch (error) {
    console.error('❌ Error checking routine data:', error.message);
  }
}

checkRoutineDataWithAuth();
