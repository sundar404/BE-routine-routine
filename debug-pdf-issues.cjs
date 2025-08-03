const { RoutinePDFGenerator } = require('./backend/utils/pdfGeneration');

// Mock data to test both issues
const mockTimeSlots = [
  { _id: 'slot0', startTime: '10:15', endTime: '11:05', sortOrder: 1, isBreak: false },
  { _id: 'slot1', startTime: '11:05', endTime: '11:55', sortOrder: 2, isBreak: false },
  { _id: 'slot2', startTime: '11:55', endTime: '12:45', sortOrder: 3, isBreak: true },
  { _id: 'slot3', startTime: '12:45', endTime: '13:35', sortOrder: 4, isBreak: false },
  { _id: 'slot4', startTime: '13:35', endTime: '14:25', sortOrder: 5, isBreak: false }
];

// Mock routine slots with multi-group issue
const mockRoutineSlots = [
  // Multi-group class - should appear as ONE merged cell, not separate
  { 
    dayIndex: 0, 
    slotIndex: 0, 
    subjectId: { name: 'Computer Programming', code: 'CT401' },
    teacherIds: [{ shortName: 'Teacher A' }],
    roomId: { name: 'Room 1' },
    classType: 'P',
    labGroup: 'A'
  },
  { 
    dayIndex: 0, 
    slotIndex: 0, 
    subjectId: { name: 'Computer Programming', code: 'CT401' },
    teacherIds: [{ shortName: 'Teacher B' }],
    roomId: { name: 'Room 2' },
    classType: 'P',
    labGroup: 'B'
  }
];

console.log('🧪 Testing PDF Generation Issues');
console.log('========================================');

const generator = new RoutinePDFGenerator();

// Test 1: Time slot alignment
console.log('\n1. Testing Time Slot Alignment:');
const routineGrid = generator.createRoutineGrid(mockTimeSlots);
console.log('Grid keys (should use timeSlot._id):', Object.keys(routineGrid[0]));

// Test 2: Populate grid
console.log('\n2. Testing Grid Population:');
generator.populateRoutineGrid(routineGrid, mockRoutineSlots, mockTimeSlots);

console.log('\n3. Final Grid Analysis:');
console.log('Sunday data:', routineGrid[0]);

// The issue should be:
// - Time slots should start at 10:15, not 11:05
// - Multi-group classes should create ONE merged cell, not separate cells
