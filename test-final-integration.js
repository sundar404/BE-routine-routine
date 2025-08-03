#!/usr/bin/env node
/**
 * Final integration test for semester group filtering
 * Tests both backend and frontend behavior
 */

const axios = require('axios');

async function testTeacherRoutineFiltering() {
  console.log('=== Testing Teacher Routine Semester Group Filtering ===\n');
  
  const baseURL = 'http://localhost:3000';
  const teacherId = '676e9dc51e9b7a7db2b07c0a'; // Anish Adhikari
  
  try {
    // Test 1: Get full teacher routine (all semesters)
    console.log('1. Fetching teacher routine (all semesters)...');
    const allResponse = await axios.get(`${baseURL}/api/teachers/${teacherId}/routine`);
    
    if (allResponse.data?.routine) {
      console.log('✓ Successfully fetched teacher routine');
      
      // Count total classes
      let totalClassCount = 0;
      Object.values(allResponse.data.routine).forEach(daySlots => {
        Object.values(daySlots).forEach(slotData => {
          if (Array.isArray(slotData)) {
            totalClassCount += slotData.length;
          } else if (slotData) {
            totalClassCount += 1;
          }
        });
      });
      
      console.log(`   Total classes found: ${totalClassCount}`);
      
      // Sample first few classes to check semester distribution
      let sampleClasses = [];
      for (const [dayKey, daySlots] of Object.entries(allResponse.data.routine)) {
        for (const [slotKey, slotData] of Object.entries(daySlots)) {
          if (Array.isArray(slotData)) {
            sampleClasses.push(...slotData.slice(0, 2));
          } else if (slotData) {
            sampleClasses.push(slotData);
          }
          if (sampleClasses.length >= 6) break;
        }
        if (sampleClasses.length >= 6) break;
      }
      
      console.log('   Sample classes and their semesters:');
      sampleClasses.forEach((cls, i) => {
        console.log(`   ${i+1}. ${cls.subjectName} - Semester ${cls.semester} (${cls.semester % 2 === 1 ? 'Odd' : 'Even'})`);
      });
      
    } else {
      console.log('✗ No routine data found');
      return;
    }
    
    console.log('\n2. Testing filtering logic simulation...');
    
    // Simulate frontend filtering
    const routineData = allResponse.data;
    
    // Test odd filtering
    const oddFiltered = filterRoutineData(routineData, 'odd');
    let oddClassCount = countClasses(oddFiltered);
    
    // Test even filtering  
    const evenFiltered = filterRoutineData(routineData, 'even');
    let evenClassCount = countClasses(evenFiltered);
    
    console.log(`   Odd semester classes: ${oddClassCount}`);
    console.log(`   Even semester classes: ${evenClassCount}`);
    console.log(`   Total classes: ${oddClassCount + evenClassCount}`);
    
    if (oddClassCount > 0 && evenClassCount > 0) {
      console.log('✓ Both odd and even semester classes found - filtering should work correctly');
    } else if (oddClassCount > 0) {
      console.log('! Only odd semester classes found');
    } else if (evenClassCount > 0) {
      console.log('! Only even semester classes found');
    } else {
      console.log('✗ No classes found in either group');
    }
    
  } catch (error) {
    console.error('Error testing teacher routine:', error.message);
  }
}

// Helper functions
function filterRoutineData(routineData, semesterGroup) {
  if (!routineData?.routine || semesterGroup === 'all') {
    return routineData;
  }

  const filteredRoutineData = {};
  
  for (let day = 0; day <= 6; day++) {
    filteredRoutineData[day] = {};
  }

  Object.entries(routineData.routine).forEach(([dayIndex, daySlots]) => {
    if (daySlots && typeof daySlots === 'object') {
      Object.entries(daySlots).forEach(([slotIndex, slotData]) => {
        if (slotData) {
          if (Array.isArray(slotData)) {
            const filteredSlots = slotData.filter(classInfo => {
              if (classInfo && typeof classInfo === 'object') {
                const semester = parseInt(classInfo.semester);
                return isSemesterInGroup(semester, semesterGroup);
              }
              return false;
            });
            
            if (filteredSlots.length > 0) {
              filteredRoutineData[dayIndex][slotIndex] = filteredSlots;
            }
          } else if (typeof slotData === 'object') {
            const semester = parseInt(slotData.semester);
            if (isSemesterInGroup(semester, semesterGroup)) {
              filteredRoutineData[dayIndex][slotIndex] = slotData;
            }
          }
        }
      });
    }
  });

  return {
    ...routineData,
    routine: filteredRoutineData
  };
}

function isSemesterInGroup(semester, semesterGroup) {
  if (semesterGroup === 'all') return true;
  if (semesterGroup === 'odd') return semester % 2 === 1;
  if (semesterGroup === 'even') return semester % 2 === 0;
  return false;
}

function countClasses(routineData) {
  let count = 0;
  if (routineData?.routine) {
    Object.values(routineData.routine).forEach(daySlots => {
      Object.values(daySlots).forEach(slotData => {
        if (Array.isArray(slotData)) {
          count += slotData.length;
        } else if (slotData) {
          count += 1;
        }
      });
    });
  }
  return count;
}

// Check if axios is available
try {
  require.resolve('axios');
  testTeacherRoutineFiltering().then(() => {
    console.log('\n=== Test Complete ===');
  });
} catch (e) {
  console.log('axios not available, installing...');
  require('child_process').exec('npm install axios', (error, stdout, stderr) => {
    if (error) {
      console.error('Failed to install axios:', error);
      return;
    }
    console.log('axios installed, running test...');
    delete require.cache[require.resolve('axios')];
    testTeacherRoutineFiltering().then(() => {
      console.log('\n=== Test Complete ===');
    });
  });
}
