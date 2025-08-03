#!/usr/bin/env node

/**
 * Test script to verify semester group collision detection and storage
 */

const axios = require('axios');

const API_BASE = 'http://localhost:7102/api';

// Test configuration
const TEST_CONFIG = {
  programCode: 'BCT',
  dayIndex: 1, // Monday
  slotIndex: 1, // First time slot
  teacherId: null, // Will be populated from API
  roomId: null, // Will be populated from API
  subjectIds: { // Will be populated from API
    odd: null,
    even: null
  }
};

async function getAuthToken() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com', // Update with actual admin credentials
      password: 'admin123'
    });
    return response.data.token;
  } catch (error) {
    console.error('Failed to get auth token:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function getTestData(token) {
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // Get teachers
    const teachersResponse = await axios.get(`${API_BASE}/teachers`, { headers });
    const teachers = teachersResponse.data.data || teachersResponse.data;
    if (teachers.length === 0) {
      throw new Error('No teachers found');
    }
    TEST_CONFIG.teacherId = teachers[0]._id;
    console.log('✅ Using teacher:', teachers[0].shortName);

    // Get rooms
    const roomsResponse = await axios.get(`${API_BASE}/rooms`, { headers });
    const rooms = roomsResponse.data.data || roomsResponse.data;
    if (rooms.length === 0) {
      throw new Error('No rooms found');
    }
    TEST_CONFIG.roomId = rooms[0]._id;
    console.log('✅ Using room:', rooms[0].name);

    // Get subjects
    const subjectsResponse = await axios.get(`${API_BASE}/subjects`, { headers });
    const subjects = subjectsResponse.data.data || subjectsResponse.data;
    if (subjects.length < 2) {
      throw new Error('Need at least 2 subjects for testing');
    }
    TEST_CONFIG.subjectIds.odd = subjects[0]._id;
    TEST_CONFIG.subjectIds.even = subjects[1]._id;
    console.log('✅ Using subjects:', subjects[0].name, 'and', subjects[1].name);

  } catch (error) {
    console.error('Failed to get test data:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function clearExistingSlots(token) {
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // Clear BCT Sem 1 AB
    await axios.delete(`${API_BASE}/routines/BCT/1/AB/clear-all`, { headers });
    console.log('✅ Cleared BCT Sem 1 AB');
    
    // Clear BCT Sem 2 AB  
    await axios.delete(`${API_BASE}/routines/BCT/2/AB/clear-all`, { headers });
    console.log('✅ Cleared BCT Sem 2 AB');
  } catch (error) {
    console.log('⚠️  Could not clear existing slots (may not exist):', error.response?.data?.message || error.message);
  }
}

async function assignClass(token, semester, section, subjectId, description) {
  const headers = { Authorization: `Bearer ${token}` };
  
  const assignmentData = {
    dayIndex: TEST_CONFIG.dayIndex,
    slotIndex: TEST_CONFIG.slotIndex,
    subjectId: subjectId,
    teacherIds: [TEST_CONFIG.teacherId],
    roomId: TEST_CONFIG.roomId,
    classType: 'L'
  };

  try {
    const response = await axios.post(
      `${API_BASE}/routines/${TEST_CONFIG.programCode}/${semester}/${section}/assign`,
      assignmentData,
      { headers }
    );
    
    console.log(`✅ Successfully assigned ${description}:`, response.data.message);
    return response.data.data;
  } catch (error) {
    console.error(`❌ Failed to assign ${description}:`, error.response?.data || error.message);
    throw error;
  }
}

async function checkRoutines(token) {
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // Check BCT Sem 1 AB routine
    const sem1Response = await axios.get(`${API_BASE}/routines/BCT/1/AB`, { headers });
    const sem1Routine = sem1Response.data.data?.routine;
    const sem1Slot = sem1Routine?.[TEST_CONFIG.dayIndex]?.[TEST_CONFIG.slotIndex];
    
    // Check BCT Sem 2 AB routine
    const sem2Response = await axios.get(`${API_BASE}/routines/BCT/2/AB`, { headers });
    const sem2Routine = sem2Response.data.data?.routine;
    const sem2Slot = sem2Routine?.[TEST_CONFIG.dayIndex]?.[TEST_CONFIG.slotIndex];
    
    console.log('\n📊 SEMESTER GROUP TEST RESULTS:');
    console.log('===============================');
    
    if (sem1Slot) {
      console.log(`✅ Semester 1 (odd group): ${sem1Slot.subjectName} found`);
    } else {
      console.log('❌ Semester 1 (odd group): No class found');
    }
    
    if (sem2Slot) {
      console.log(`✅ Semester 2 (even group): ${sem2Slot.subjectName} found`);
    } else {
      console.log('❌ Semester 2 (even group): No class found');
    }
    
    if (sem1Slot && sem2Slot) {
      console.log('\n🎉 SUCCESS: Both odd and even semester classes coexist!');
      console.log('The semester group collision detection is working properly.');
      return true;
    } else {
      console.log('\n❌ FAILURE: Classes from different semester groups are conflicting.');
      return false;
    }
    
  } catch (error) {
    console.error('Failed to check routines:', error.response?.data || error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 SEMESTER GROUP COLLISION DETECTION TEST');
  console.log('==========================================\n');
  
  try {
    // 1. Get authentication token
    console.log('1. Getting authentication token...');
    const token = await getAuthToken();
    console.log('✅ Authentication successful\n');
    
    // 2. Get test data
    console.log('2. Getting test data...');
    await getTestData(token);
    console.log('✅ Test data loaded\n');
    
    // 3. Clear existing slots
    console.log('3. Clearing existing slots...');
    await clearExistingSlots(token);
    console.log('✅ Existing slots cleared\n');
    
    // 4. Assign class to odd semester (Semester 1)
    console.log('4. Assigning class to odd semester (Semester 1)...');
    await assignClass(token, 1, 'AB', TEST_CONFIG.subjectIds.odd, 'Semester 1 (odd) class');
    console.log('');
    
    // 5. Assign class to even semester (Semester 2) at same time slot
    console.log('5. Assigning class to even semester (Semester 2) at same time slot...');
    await assignClass(token, 2, 'AB', TEST_CONFIG.subjectIds.even, 'Semester 2 (even) class');
    console.log('');
    
    // 6. Check if both classes exist
    console.log('6. Checking if both classes coexist...');
    const success = await checkRoutines(token);
    
    if (success) {
      console.log('\n✅ TEST PASSED: Semester group collision detection is working correctly!');
      process.exit(0);
    } else {
      console.log('\n❌ TEST FAILED: Semester group collision detection needs attention.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);
