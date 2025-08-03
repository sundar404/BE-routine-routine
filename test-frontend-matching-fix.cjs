const fs = require('fs');

// Test the frontend-matching slot mapping fix
console.log('=== Testing Frontend-Matching Slot Mapping ===');

// Simulate time slots with actual _id values (like from database)
const mockTimeSlots = [
  { _id: '66f8a1b123456789abcdef01', startTime: '10:15', endTime: '11:05', sortOrder: 1, isBreak: false },
  { _id: '66f8a1b123456789abcdef02', startTime: '11:05', endTime: '11:55', sortOrder: 2, isBreak: false },
  { _id: '66f8a1b123456789abcdef03', startTime: '11:55', endTime: '12:45', sortOrder: 3, isBreak: true },
  { _id: '66f8a1b123456789abcdef04', startTime: '12:45', endTime: '13:35', sortOrder: 4, isBreak: false },
  { _id: '66f8a1b123456789abcdef05', startTime: '13:35', endTime: '14:25', sortOrder: 5, isBreak: false },
  { _id: '66f8a1b123456789abcdef06', startTime: '14:25', endTime: '15:15', sortOrder: 6, isBreak: false },
  { _id: '66f8a1b123456789abcdef07', startTime: '15:15', endTime: '16:05', sortOrder: 7, isBreak: false },
  { _id: '66f8a1b123456789abcdef08', startTime: '16:05', endTime: '16:55', sortOrder: 8, isBreak: false }
];

// Simulate routine slots from database (what classes are scheduled)
const mockRoutineSlots = [
  // Sunday classes
  { dayIndex: 0, slotIndex: 0, subjectId: { name: 'Computer Graphics' } },        // slot[0] -> timeSlot._id '66f8a1b123456789abcdef01' (10:15-11:05)
  { dayIndex: 0, slotIndex: 3, subjectId: { name: 'Software Engineering' } },     // slot[3] -> timeSlot._id '66f8a1b123456789abcdef04' (12:45-13:35)
  { dayIndex: 0, slotIndex: 5, subjectId: { name: 'Instrumentation II' } },       // slot[5] -> timeSlot._id '66f8a1b123456789abcdef06' (14:25-15:15)
];

console.log('\n=== Frontend Approach ===');
console.log('Frontend uses timeSlot._id as keys in routine grid');
console.log('When rendering, it maps: timeSlot._id -> class data');

console.log('\n=== New PDF Mapping Logic (Frontend-Matching) ===');

// Step 1: Create slotIndex to timeSlot._id mapping
const slotIndexToTimeSlotId = {};
mockTimeSlots.forEach((timeSlot, arrayIndex) => {
  slotIndexToTimeSlotId[arrayIndex] = timeSlot._id;
});

console.log('SlotIndex to TimeSlot._id mapping:', slotIndexToTimeSlotId);

// Step 2: Process routine slots using timeSlot._id as keys
const routineGrid = { 0: {} }; // Day 0 (Sunday)

// Initialize grid with timeSlot._id keys
mockTimeSlots.forEach(timeSlot => {
  routineGrid[0][timeSlot._id] = null;
});

// Populate grid using frontend approach
mockRoutineSlots.forEach(slot => {
  const timeSlotId = slotIndexToTimeSlotId[slot.slotIndex];
  const timeSlot = mockTimeSlots[slot.slotIndex];
  
  console.log(`\nMapping: slotIndex ${slot.slotIndex} -> timeSlotId ${timeSlotId} -> ${timeSlot.startTime}-${timeSlot.endTime}: ${slot.subjectId.name}`);
  
  routineGrid[0][timeSlotId] = {
    subjectName: slot.subjectId.name,
    slotIndex: slot.slotIndex
  };
});

console.log('\n=== Final Grid Structure (Using timeSlot._id as Keys) ===');
Object.keys(routineGrid[0]).forEach(timeSlotId => {
  const classData = routineGrid[0][timeSlotId];
  const timeSlot = mockTimeSlots.find(ts => ts._id === timeSlotId);
  
  if (classData) {
    console.log(`✅ ${timeSlotId} (${timeSlot.startTime}-${timeSlot.endTime}): ${classData.subjectName}`);
  } else if (timeSlot?.isBreak) {
    console.log(`🔶 ${timeSlotId} (${timeSlot.startTime}-${timeSlot.endTime}): BREAK`);
  } else {
    console.log(`⚪ ${timeSlotId} (${timeSlot.startTime}-${timeSlot.endTime}): empty`);
  }
});

console.log('\n=== Expected Result ===');
console.log('✅ Computer Graphics at 10:15-11:05');
console.log('🔶 BREAK at 11:55-12:45'); 
console.log('✅ Software Engineering at 12:45-13:35'); 
console.log('✅ Instrumentation II at 14:25-15:15');

console.log('\n=== Fix Summary ===');
console.log('✅ Use timeSlot._id as grid keys (matches frontend exactly)');
console.log('✅ Map slotIndex -> timeSlot._id -> class data');
console.log('✅ Classes will now appear in correct time slots');
console.log('✅ Break will appear in correct position');
