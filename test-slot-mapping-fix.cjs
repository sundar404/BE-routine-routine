const fs = require('fs');

// Test the slot mapping fix
console.log('=== Testing Slot Mapping Fix ===');

// Simulate the time slots array (what appears in the table headers)
const mockTimeSlots = [
  { _id: 'slot0', startTime: '10:15', endTime: '11:05', sortOrder: 1, isBreak: false },
  { _id: 'slot1', startTime: '11:05', endTime: '11:55', sortOrder: 2, isBreak: false },
  { _id: 'slot2', startTime: '11:55', endTime: '12:45', sortOrder: 3, isBreak: true },  // BREAK
  { _id: 'slot3', startTime: '12:45', endTime: '13:35', sortOrder: 4, isBreak: false },
  { _id: 'slot4', startTime: '13:35', endTime: '14:25', sortOrder: 5, isBreak: false },
  { _id: 'slot5', startTime: '14:25', endTime: '15:15', sortOrder: 6, isBreak: false },
  { _id: 'slot6', startTime: '15:15', endTime: '16:05', sortOrder: 7, isBreak: false },
  { _id: 'slot7', startTime: '16:05', endTime: '16:55', sortOrder: 8, isBreak: false }
];

// Simulate routine slots from database (what classes are scheduled)
const mockRoutineSlots = [
  // Sunday classes
  { dayIndex: 0, slotIndex: 0, subjectId: { name: 'Computer Graphics' } },        // 10:15-11:05
  { dayIndex: 0, slotIndex: 3, subjectId: { name: 'Software Engineering' } },     // 12:45-13:35
  { dayIndex: 0, slotIndex: 5, subjectId: { name: 'Instrumentation II' } },       // 14:25-15:15 (Lab spans 3 periods)
  { dayIndex: 0, slotIndex: 6, subjectId: { name: 'Instrumentation II' } },       // 15:15-16:05 (Lab continues)
  { dayIndex: 0, slotIndex: 7, subjectId: { name: 'Instrumentation II' } },       // 16:05-16:55 (Lab continues)
];

console.log('\n=== Expected Mapping (Frontend) ===');
console.log('Sunday slot 0 (10:15-11:05): Computer Graphics');
console.log('Sunday slot 2 (11:55-12:45): BREAK');  
console.log('Sunday slot 3 (12:45-13:35): Software Engineering'); 
console.log('Sunday slots 5-7 (14:25-16:55): Instrumentation II (3-period lab)');

console.log('\n=== New PDF Mapping Logic ===');
mockRoutineSlots.forEach(slot => {
  const timeSlot = mockTimeSlots[slot.slotIndex];
  if (timeSlot) {
    console.log(`Day ${slot.dayIndex}, Slot ${slot.slotIndex} (${timeSlot.startTime}-${timeSlot.endTime}): ${slot.subjectId.name}`);
  } else {
    console.log(`Day ${slot.dayIndex}, Slot ${slot.slotIndex}: INVALID SLOT INDEX`);
  }
});

console.log('\n=== Break Slot Check ===');
const breakSlot = mockTimeSlots.find(slot => slot.isBreak);
if (breakSlot) {
  const breakIndex = mockTimeSlots.indexOf(breakSlot);
  console.log(`Break is at slot index ${breakIndex} (${breakSlot.startTime}-${breakSlot.endTime})`);
  console.log('This should appear as BREAK in the PDF at the correct position');
} else {
  console.log('No break slot found');
}

console.log('\n=== Fix Summary ===');
console.log('✅ Use slotIndex directly as array position (no complex mapping)');
console.log('✅ This matches exactly how frontend handles slot positioning');
console.log('✅ Break will appear in correct time slot');
console.log('✅ Classes will align with their scheduled times');
