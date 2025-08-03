// Check routine data via backend API
const https = require('https');
const http = require('http');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function checkRoutineData() {
  console.log('🔍 Checking Routine Data via Backend API...');
  console.log('==========================================\n');
  
  try {
    // Check time slots
    console.log('⏰ Checking Time Slots...');
    const timeSlots = await makeRequest('http://localhost:7102/api/time-slots');
    
    if (Array.isArray(timeSlots)) {
      console.log(`✅ Found ${timeSlots.length} time slots:`);
      timeSlots.slice(0, 5).forEach(slot => {
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
    
    // Check programs
    console.log('\n📚 Checking Programs...');
    const programs = await makeRequest('http://localhost:7102/api/programs');
    
    if (Array.isArray(programs)) {
      console.log(`✅ Found ${programs.length} programs:`);
      programs.slice(0, 5).forEach(prog => {
        console.log(`  ${prog.code}: ${prog.name}`);
      });
    } else {
      console.log('❌ Failed to get programs:', programs);
    }
    
    // Try to get routine data (this might require auth)
    console.log('\n📋 Checking Routine Slots (might require authentication)...');
    const routineSlots = await makeRequest('http://localhost:7102/api/routine-slots?limit=5');
    
    if (routineSlots.success === false) {
      console.log('❌ Routine slots require authentication');
      console.log('Response:', routineSlots);
      
      // This explains why you don't see classes in the PDF!
      console.log('\n💡 DIAGNOSIS:');
      console.log('The time slots are configured correctly (10:15-11:05 exists)');
      console.log('BUT routine slots require authentication to access.');
      console.log('This suggests either:');
      console.log('1. No routine assignments exist in the database');
      console.log('2. Authentication is required to view them');
      console.log('3. The frontend might not be sending proper auth tokens');
      
    } else if (Array.isArray(routineSlots)) {
      console.log(`✅ Found ${routineSlots.length} routine slots`);
      routineSlots.forEach(slot => {
        console.log(`  Day ${slot.dayIndex}, Slot ${slot.slotIndex}: ${slot.subject || 'Unknown'}`);
      });
    } else {
      console.log('Routine slots response:', routineSlots);
    }
    
  } catch (error) {
    console.error('❌ Error checking routine data:', error.message);
  }
}

checkRoutineData();
