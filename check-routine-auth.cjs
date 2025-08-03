// Check routine data via backend API with authentication
const https = require('https');
const http = require('http');

// Authentication credentials
const credentials = {
  email: 'admin@ioe.edu.np',
  password: 'admin123'
};

// Function to make HTTP request
async function makeRequest(url, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function checkRoutineDataWithAuth() {
  console.log('🔍 Checking Routine Data via Backend API with Authentication...');
  console.log('=========================================================\n');
  
  try {
    // Login to get token
    console.log('🔑 Logging in as admin...');
    const loginResponse = await makeRequest(
      'http://localhost:7102/api/auth/login',
      'POST',
      credentials
    );
    
    if (!loginResponse.token) {
      console.log('❌ Login failed:', loginResponse);
      return;
    }
    
    const token = loginResponse.token;
    console.log('✅ Login successful! Token received.');
    
    // Check time slots
    console.log('\n⏰ Checking Time Slots...');
    const timeSlots = await makeRequest('http://localhost:7102/api/time-slots', 'GET', null, token);
    
    if (Array.isArray(timeSlots)) {
      console.log(`✅ Found ${timeSlots.length} time slots:`);
      timeSlots.sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 10).forEach(slot => {
        console.log(`  ${slot._id}: ${slot.startTime}-${slot.endTime} (sortOrder: ${slot.sortOrder})`);
      });
      
      // Check if 10:15 slot exists
      const slot1015 = timeSlots.find(s => s.startTime === '10:15');
      if (slot1015) {
        console.log(`✅ Found 10:15 time slot with ID: ${slot1015._id}`);
      } else {
        console.log('❌ 10:15 time slot not found!');
      }
    } else {
      console.log('❌ Failed to get time slots:', timeSlots);
    }
    
    // Check routine slots
    console.log('\n📋 Checking Routine Slots...');
    const routineSlots = await makeRequest('http://localhost:7102/api/routine-slots?limit=10', 'GET', null, token);
    
    if (Array.isArray(routineSlots)) {
      console.log(`✅ Found ${routineSlots.length} routine slots`);
      
      if (routineSlots.length === 0) {
        console.log('\n❌ NO ROUTINE ASSIGNMENTS FOUND!');
        console.log('This explains why your PDF shows empty time slots!');
        console.log('You need to assign classes in the routine grid first.');
      } else {
        // Get sample of routine slots
        console.log('\nSample routine assignments:');
        routineSlots.slice(0, 5).forEach(slot => {
          console.log(`  Day ${slot.dayIndex}, Slot ${slot.slotIndex}: ${slot.subjectId?.name || 'Unknown'} (${slot.classType})`);
          console.log(`    Program: ${slot.programCode}, Section: ${slot.section}, Room: ${slot.roomId?.name || 'N/A'}`);
          if (slot.teacherIds && slot.teacherIds.length > 0) {
            console.log(`    Teachers: ${slot.teacherIds.map(t => t.shortName || t.name).join(', ')}`);
          }
          console.log('');
        });
        
        // Check for 10:15 slot assignments
        console.log('\nChecking assignments in 10:15-11:05 time slot:');
        const timeSlot1015 = timeSlots.find(s => s.startTime === '10:15');
        if (timeSlot1015) {
          const slotsAt1015 = routineSlots.filter(s => s.timeSlotId === timeSlot1015._id);
          console.log(`Found ${slotsAt1015.length} assignments in the 10:15 time slot`);
          
          if (slotsAt1015.length === 0) {
            console.log('❌ No classes assigned to 10:15-11:05 time slot!');
            console.log('This explains why your PDF shows empty column for 10:15');
          } else {
            slotsAt1015.slice(0, 3).forEach(slot => {
              console.log(`  Day ${slot.dayIndex}: ${slot.subjectId?.name || 'Unknown'} (${slot.classType})`);
            });
          }
        }
        
        // Check for multi-group classes
        console.log('\nChecking for multi-group classes:');
        // Group by unique combinations that would indicate multi-group
        const multiGroupMap = {};
        routineSlots.forEach(slot => {
          if (slot.dayIndex && slot.timeSlotId && slot.subjectId?._id) {
            const key = `${slot.dayIndex}-${slot.timeSlotId}-${slot.subjectId._id}-${slot.classType}`;
            if (!multiGroupMap[key]) {
              multiGroupMap[key] = [];
            }
            multiGroupMap[key].push(slot);
          }
        });
        
        const multiGroupEntries = Object.values(multiGroupMap).filter(group => group.length > 1);
        console.log(`Found ${multiGroupEntries.length} potential multi-group class sets`);
        
        if (multiGroupEntries.length === 0) {
          console.log('❌ No multi-group classes found in the database');
          console.log('This explains why your PDF does not show merged cells');
        } else {
          console.log('\nSample multi-group classes:');
          multiGroupEntries.slice(0, 2).forEach(group => {
            const firstSlot = group[0];
            console.log(`  ${firstSlot.subjectId?.name || 'Unknown'} (${firstSlot.classType})`);
            console.log(`  Day ${firstSlot.dayIndex}, Time: ${timeSlots.find(t => t._id === firstSlot.timeSlotId)?.startTime || 'Unknown'}`);
            console.log(`  Groups: ${group.map(g => `${g.programCode}-${g.section}`).join(', ')}`);
            console.log('');
          });
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
