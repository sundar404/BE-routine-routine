// Debug the raw API response for BCT-5-AB
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

async function debugRawResponse() {
  console.log('🔍 Debugging Raw API Response for BCT-5-AB...');
  
  try {
    // Login
    const loginData = {
      email: 'admin@ioe.edu.np',
      password: 'admin123'
    };
    
    const loginResponse = await makeRequest('http://localhost:7102/api/auth/login', 'POST', loginData);
    
    if (!loginResponse.token) {
      console.log('❌ Login failed:', loginResponse);
      return;
    }
    
    const token = loginResponse.token;
    console.log('✅ Login successful');
    
    // Get routine slots
    console.log('\n📋 Fetching routine slots raw data...');
    const routineSlots = await makeRequest('http://localhost:7102/api/routine-slots?program=BCT&semester=5&section=AB', 'GET', null, token);
    
    if (!Array.isArray(routineSlots)) {
      console.log('❌ Failed to get routine slots:', routineSlots);
      return;
    }
    
    console.log(`Found ${routineSlots.length} routine slots`);
    
    // Show first few raw slots
    console.log('\n🔍 First 3 raw routine slots:');
    routineSlots.slice(0, 3).forEach((slot, index) => {
      console.log(`\n--- Slot ${index + 1} ---`);
      console.log('All fields:', Object.keys(slot).sort());
      console.log('Time-related fields:');
      
      // Check all possible time field names
      const timeFields = Object.keys(slot).filter(key => 
        key.toLowerCase().includes('time') || 
        key.toLowerCase().includes('slot')
      );
      
      timeFields.forEach(field => {
        console.log(`  ${field}: ${JSON.stringify(slot[field])}`);
      });
      
      console.log('Core fields:');
      console.log(`  dayIndex: ${slot.dayIndex}`);
      console.log(`  programCode: ${slot.programCode}`);
      console.log(`  semester: ${slot.semester}`);
      console.log(`  section: ${slot.section}`);
      console.log(`  subjectId: ${JSON.stringify(slot.subjectId)}`);
      console.log(`  classType: ${slot.classType}`);
      console.log(`  isActive: ${slot.isActive}`);
    });
    
    // Check specifically for Sunday slots (dayIndex 0)
    console.log('\n🗓️ Checking Sunday slots (dayIndex = 0):');
    const sundaySlots = routineSlots.filter(slot => slot.dayIndex === 0);
    console.log(`Found ${sundaySlots.length} Sunday slots`);
    
    if (sundaySlots.length > 0) {
      console.log('Sunday slot details:');
      sundaySlots.forEach((slot, index) => {
        console.log(`  ${index + 1}. Subject: ${slot.subjectId?.name || slot.subjectId || 'N/A'}, timeSlotId: ${slot.timeSlotId}, slotIndex: ${slot.slotIndex}, classType: ${slot.classType}`);
      });
    }
    
    // Check for Monday slots (dayIndex 1) - the day showing issues in PDF
    console.log('\n📅 Checking Monday slots (dayIndex = 1):');
    const mondaySlots = routineSlots.filter(slot => slot.dayIndex === 1);
    console.log(`Found ${mondaySlots.length} Monday slots`);
    
    if (mondaySlots.length > 0) {
      console.log('Monday slot details:');
      mondaySlots.forEach((slot, index) => {
        console.log(`  ${index + 1}. Subject: ${slot.subjectId?.name || slot.subjectId || 'N/A'}, timeSlotId: ${slot.timeSlotId}, slotIndex: ${slot.slotIndex}, classType: ${slot.classType}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugRawResponse();
