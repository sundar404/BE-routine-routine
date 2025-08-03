#!/usr/bin/env node
/**
 * Test script to verify frontend filtering logic for teacher routine
 * Tests the new array-based slot structure and semester group filtering
 */

// Simulate the filtering logic
const filterRoutineBySemesterGroup = (routineData, semesterGroup) => {
  if (!routineData?.routine || semesterGroup === 'all') {
    return routineData;
  }

  // Helper function
  const isSemesterInGroup = (semester, semesterGroup) => {
    if (semesterGroup === 'all') return true;
    if (semesterGroup === 'odd') return semester % 2 === 1;
    if (semesterGroup === 'even') return semester % 2 === 0;
    return false;
  };

  const filteredRoutineData = {};
  
  // Initialize with same structure
  for (let day = 0; day <= 6; day++) {
    filteredRoutineData[day] = {};
  }

  Object.entries(routineData.routine).forEach(([dayIndex, daySlots]) => {
    if (daySlots && typeof daySlots === 'object') {
      Object.entries(daySlots).forEach(([slotIndex, slotData]) => {
        if (slotData) {
          // Handle both single slot objects and arrays of slots
          if (Array.isArray(slotData)) {
            // For teacher/room routines with arrays of slots
            const filteredSlots = slotData.filter(classInfo => {
              if (classInfo && typeof classInfo === 'object') {
                const semester = parseInt(classInfo.semester);
                return isSemesterInGroup(semester, semesterGroup);
              }
              return false;
            });
            
            // Only include if there are filtered slots
            if (filteredSlots.length > 0) {
              filteredRoutineData[dayIndex][slotIndex] = filteredSlots;
            }
          } else if (typeof slotData === 'object') {
            // For main routine with single slot objects
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
};

// Test data - simulating teacher routine with arrays of slots
const testTeacherRoutine = {
  routine: {
    "1": { // Monday
      "timeSlot1": [
        {
          subjectName: "Math I",
          semester: 1,
          section: "A",
          programCode: "BCT",
          roomName: "101"
        },
        {
          subjectName: "Physics II", 
          semester: 2,
          section: "B",
          programCode: "BCT",
          roomName: "102"
        }
      ],
      "timeSlot2": [
        {
          subjectName: "Programming III",
          semester: 3,
          section: "A", 
          programCode: "BCT",
          roomName: "103"
        }
      ]
    },
    "2": { // Tuesday
      "timeSlot1": [
        {
          subjectName: "Calculus IV",
          semester: 4,
          section: "B",
          programCode: "BCT", 
          roomName: "104"
        }
      ]
    }
  }
};

console.log('=== Testing Frontend Filtering Logic ===\n');

console.log('Original routine structure:');
console.log('Monday timeSlot1:', testTeacherRoutine.routine["1"]["timeSlot1"]);
console.log('Monday timeSlot2:', testTeacherRoutine.routine["1"]["timeSlot2"]);
console.log('Tuesday timeSlot1:', testTeacherRoutine.routine["2"]["timeSlot1"]);
console.log();

// Test filtering by odd semesters
console.log('--- Filtering by ODD semesters ---');
const oddFiltered = filterRoutineBySemesterGroup(testTeacherRoutine, 'odd');
console.log('Monday timeSlot1 (odd):', oddFiltered.routine["1"]?.["timeSlot1"] || "No classes");
console.log('Monday timeSlot2 (odd):', oddFiltered.routine["1"]?.["timeSlot2"] || "No classes");
console.log('Tuesday timeSlot1 (odd):', oddFiltered.routine["2"]?.["timeSlot1"] || "No classes");
console.log();

// Test filtering by even semesters  
console.log('--- Filtering by EVEN semesters ---');
const evenFiltered = filterRoutineBySemesterGroup(testTeacherRoutine, 'even');
console.log('Monday timeSlot1 (even):', evenFiltered.routine["1"]?.["timeSlot1"] || "No classes");
console.log('Monday timeSlot2 (even):', evenFiltered.routine["1"]?.["timeSlot2"] || "No classes");
console.log('Tuesday timeSlot1 (even):', evenFiltered.routine["2"]?.["timeSlot1"] || "No classes");
console.log();

// Test filtering by all semesters
console.log('--- Filtering by ALL semesters ---');
const allFiltered = filterRoutineBySemesterGroup(testTeacherRoutine, 'all');
console.log('Monday timeSlot1 (all):', allFiltered.routine["1"]?.["timeSlot1"] || "No classes");
console.log('Monday timeSlot2 (all):', allFiltered.routine["1"]?.["timeSlot2"] || "No classes");
console.log('Tuesday timeSlot1 (all):', allFiltered.routine["2"]?.["timeSlot1"] || "No classes");
console.log();

// Verify expected results
console.log('=== Verification ===');
console.log('Expected odd results:');
console.log('- Monday timeSlot1: Math I (semester 1)');
console.log('- Monday timeSlot2: Programming III (semester 3)');
console.log('- Tuesday timeSlot1: No classes');

console.log('\nExpected even results:');
console.log('- Monday timeSlot1: Physics II (semester 2)');
console.log('- Monday timeSlot2: No classes');
console.log('- Tuesday timeSlot1: Calculus IV (semester 4)');

console.log('\n=== Test Complete ===');
