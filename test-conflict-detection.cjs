#!/usr/bin/env node
/**
 * Test conflict detection for the specific case
 */

const axios = require('axios');

async function testConflictDetection() {
  console.log('=== Testing Conflict Detection for Teacher Schedule ===\n');
  
  const baseURL = 'http://localhost:7102';
  const authToken = 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..C06RPv77qpesHHeD.59ysZRweWMisbtmVj1ABz09QCsyKZK_Z9tHVpy7zzWzuchNjSK7jjyhxq1RQf5ASR_kFXsu8YkEgKDomE_R0Kv5P5E5HrNecSJ2dIYABDN_Pwk1R7U9dsjQIwWSXCjVGIBwn4bj-KvdvMMvzwHp6dqrchjrCQnsEVTyAi9ksO3iMyhh11cUU0sEJT2DyW0kpu8sIQJ2GfQ.HlyKl0W3VVu7mpopZRx8EA';
  
  try {
    // Test the specific conflicting slot
    const conflictData = {
      dayIndex: 5, // Friday
      slotIndex: 6, // The time slot where both classes exist
      teacherIds: ['68681d200bef564017898160'], // Anish Adhikari
      roomId: '686de901d10683aabdc31e53', // BCT-1-CD
      semester: 5, // Software Engineering semester
      academicYearId: '67643a3821b46f652ab38a41', // Default academic year
      recurrence: { type: 'weekly', pattern: null, customWeeks: [] },
      classCategory: 'CORE'
    };
    
    console.log('Testing conflict detection for a new semester 5 class...');
    console.log(`Day: Friday (${conflictData.dayIndex})`);
    console.log(`Slot: ${conflictData.slotIndex}`);
    console.log(`Teacher: Anish Adhikari`);
    console.log(`Semester: ${conflictData.semester} (Odd group)`);
    
    // This should detect a conflict with the existing semester 7 class
    const response = await axios.post(`${baseURL}/api/conflicts/check`, conflictData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('\n✅ Conflict detection API responded successfully');
      
      if (response.data.conflicts && response.data.conflicts.length > 0) {
        console.log(`🔴 ${response.data.conflicts.length} conflict(s) detected:`);
        response.data.conflicts.forEach((conflict, i) => {
          console.log(`   ${i+1}. Type: ${conflict.type}`);
          console.log(`      Message: ${conflict.message}`);
          if (conflict.semesterGroup) {
            console.log(`      Semester Group: ${conflict.semesterGroup}`);
          }
        });
      } else {
        console.log('🟡 No conflicts detected - this might indicate an issue with conflict detection');
      }
    } else {
      console.log('✗ Conflict detection API failed:', response.data.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Error testing conflict detection:', error.message);
    }
  }
}

// Check if axios is available
try {
  require.resolve('axios');
  testConflictDetection().then(() => {
    console.log('\n=== Test Complete ===');
  });
} catch (e) {
  console.log('axios not available, please run: npm install axios');
}
