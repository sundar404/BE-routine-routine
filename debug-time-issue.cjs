// Test actual time slot ordering issue
const mockTimeSlots = [
  { _id: 'slot0', startTime: '10:15', endTime: '11:05', sortOrder: 1, isBreak: false },
  { _id: 'slot1', startTime: '11:05', endTime: '11:55', sortOrder: 2, isBreak: false },
  { _id: 'slot2', startTime: '11:55', endTime: '12:45', sortOrder: 3, isBreak: true },
  { _id: 'slot3', startTime: '12:45', endTime: '13:35', sortOrder: 4, isBreak: false }
];

// Problem scenario: User sees 11:05 as first time but expects 10:15
console.log('User expectation vs Reality check:');
console.log('=====================================');

mockTimeSlots.forEach((slot, index) => {
  console.log(`Array index ${index}: ${slot.startTime}-${slot.endTime} (ID: ${slot._id})`);
});

console.log('\nUser says: "classes are starting from 11:05 not 10:15"');
console.log('This suggests the PDF is showing the SECOND slot (11:05) as the first column');
console.log('But our logic shows slot0 (10:15) as the first column');

// The issue might be:
// 1. Database returns time slots in wrong order (not sorted by sortOrder)
// 2. PDF headers show different times than expected
// 3. There's an off-by-one error somewhere
