/**
 * Example usage of Dynamic Time Calculation utility
 * This file demonstrates how to use the new timing system
 */

const dynamicTimeCalc = require('./backend/utils/dynamicTimeCalculation');

console.log('🚀 Dynamic Time Calculation Examples');
console.log('=====================================\n');

// Example 1: Get semester type
console.log('📋 1. Semester Type Detection:');
for (let semester = 1; semester <= 8; semester++) {
  const type = dynamicTimeCalc.getSemesterType(semester);
  console.log(`   Semester ${semester}: ${type}`);
}

// Example 2: Get slot durations
console.log('\n📋 2. Slot Durations:');
console.log('   Odd Semester (e.g., Semester 1):');
console.log(`     - Regular slot: ${dynamicTimeCalc.getSlotDuration(1)} minutes`);
console.log(`     - Break slot: ${dynamicTimeCalc.getSlotDuration(1, true)} minutes`);

console.log('   Even Semester (e.g., Semester 2):');
console.log(`     - Regular slot: ${dynamicTimeCalc.getSlotDuration(2)} minutes`);
console.log(`     - Break slot: ${dynamicTimeCalc.getSlotDuration(2, true)} minutes`);

// Example 3: Generate time slots
console.log('\n📋 3. Generate Time Slots:');

const slotDefinitions = [
  { _id: 1, label: 'First Period', sortOrder: 1, isBreak: false },
  { _id: 2, label: 'Second Period', sortOrder: 2, isBreak: false },
  { _id: 3, label: 'BREAK', sortOrder: 3, isBreak: true },
  { _id: 4, label: 'Third Period', sortOrder: 4, isBreak: false }
];

console.log('   Semester 1 (Odd) - 55 minutes per slot:');
const oddSlots = dynamicTimeCalc.generateTimeSlots(1, slotDefinitions);
oddSlots.forEach(slot => {
  console.log(`     ${slot.label}: ${slot.startTime}-${slot.endTime} (${slot.duration}min)`);
});

console.log('\n   Semester 2 (Even) - 45 minutes per slot, 30min breaks:');
const evenSlots = dynamicTimeCalc.generateTimeSlots(2, slotDefinitions);
evenSlots.forEach(slot => {
  console.log(`     ${slot.label}: ${slot.startTime}-${slot.endTime} (${slot.duration}min)`);
});

// Example 4: Timing summaries
console.log('\n📋 4. Timing Summaries:');
for (let semester of [1, 2, 7, 8]) {
  const summary = dynamicTimeCalc.getTimingSummary(semester);
  console.log(`   Semester ${semester} (${summary.semesterType}): ${summary.regularSlotDuration}min slots, starts at ${summary.startTime}`);
}

// Example 5: Time conversion utilities
console.log('\n📋 5. Time Conversion Utilities:');
console.log(`   "10:15" = ${dynamicTimeCalc.timeToMinutes("10:15")} minutes from midnight`);
console.log(`   615 minutes = ${dynamicTimeCalc.minutesToTime(615)}`);
console.log(`   Is "BREAK" a break slot? ${dynamicTimeCalc.isBreakSlot("BREAK")}`);
console.log(`   Is "First Period" a break slot? ${dynamicTimeCalc.isBreakSlot("First Period")}`);

// Example 6: Configuration
console.log('\n📋 6. Current Configuration:');
console.log('   ', JSON.stringify(dynamicTimeCalc.TIMING_CONFIG, null, 2));

console.log('\n✅ All examples completed!');
console.log('\n💡 To use in your code:');
console.log('   const dynamicTimeCalc = require("./utils/dynamicTimeCalculation");');
console.log('   const slots = dynamicTimeCalc.generateTimeSlots(semesterNumber, slotDefinitions);');
