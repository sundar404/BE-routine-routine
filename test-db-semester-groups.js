#!/usr/bin/env node

/**
 * Direct database test for semester group collision detection
 */

const mongoose = require('mongoose');

// Import the RoutineSlot model
const RoutineSlot = require('./backend/models/RoutineSlot');

const MONGODB_URI = 'mongodb+srv://079bct044manish:routine@routine.mrjj7ho.mongodb.net/bctroutine?retryWrites=true&w=majority&appName=routine';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function clearTestData() {
  try {
    // Clear any existing test data
    await RoutineSlot.deleteMany({
      programCode: 'BCT',
      section: 'AB',
      dayIndex: 1,
      slotIndex: 1
    });
    console.log('✅ Cleared existing test data');
  } catch (error) {
    console.error('⚠️  Could not clear test data:', error.message);
  }
}

async function createTestSlots() {
  try {
    console.log('\n🧪 Creating test slots...');
    
    // Create a slot for odd semester (Semester 1)
    const oddSlot = new RoutineSlot({
      programCode: 'BCT',
      semester: 1,
      semesterGroup: 'odd',
      section: 'AB',
      dayIndex: 1,
      slotIndex: 1,
      classType: 'L',
      subjectName_display: 'Test Subject Odd',
      subjectCode_display: 'TST101',
      teacherShortNames_display: ['Test Teacher 1'],
      roomName_display: 'Test Room 1',
      isActive: true
    });
    
    await oddSlot.save();
    console.log('✅ Created odd semester slot (Semester 1):', oddSlot._id);
    
    // Create a slot for even semester (Semester 2) at the same time
    const evenSlot = new RoutineSlot({
      programCode: 'BCT',
      semester: 2,
      semesterGroup: 'even',
      section: 'AB',
      dayIndex: 1,
      slotIndex: 1,
      classType: 'L',
      subjectName_display: 'Test Subject Even',
      subjectCode_display: 'TST102',
      teacherShortNames_display: ['Test Teacher 2'],
      roomName_display: 'Test Room 2',
      isActive: true
    });
    
    await evenSlot.save();
    console.log('✅ Created even semester slot (Semester 2):', evenSlot._id);
    
    return { oddSlot, evenSlot };
    
  } catch (error) {
    if (error.code === 11000) {
      console.log('❌ UNIQUE CONSTRAINT VIOLATION:', error.message);
      console.log('This indicates that the semester group is NOT properly included in the unique index');
      return null;
    } else {
      console.error('❌ Unexpected error creating slots:', error.message);
      throw error;
    }
  }
}

async function verifySlots() {
  try {
    console.log('\n🔍 Verifying slots exist in database...');
    
    // Find all slots for BCT AB at day 1, slot 1
    const slots = await RoutineSlot.find({
      programCode: 'BCT',
      section: 'AB',
      dayIndex: 1,
      slotIndex: 1,
      isActive: true
    }).sort({ semester: 1 });
    
    console.log(`Found ${slots.length} slots:`);
    
    let foundOdd = false;
    let foundEven = false;
    
    slots.forEach(slot => {
      console.log(`  - Semester ${slot.semester} (${slot.semesterGroup}): ${slot.subjectName_display}`);
      if (slot.semesterGroup === 'odd') foundOdd = true;
      if (slot.semesterGroup === 'even') foundEven = true;
    });
    
    if (foundOdd && foundEven) {
      console.log('\n🎉 SUCCESS: Both odd and even semester groups coexist!');
      console.log('✅ The semester group collision detection is working properly.');
      return true;
    } else {
      console.log('\n❌ FAILURE: Missing slots for one or both semester groups.');
      if (!foundOdd) console.log('   Missing: odd semester group');
      if (!foundEven) console.log('   Missing: even semester group');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error verifying slots:', error.message);
    return false;
  }
}

async function testUniqueConstraints() {
  try {
    console.log('\n🧪 Testing unique constraint behavior...');
    
    // Try to create another slot with same semester group (should fail)
    const duplicateSlot = new RoutineSlot({
      programCode: 'BCT',
      semester: 1, // Same semester as first slot
      semesterGroup: 'odd',
      section: 'AB',
      dayIndex: 1,
      slotIndex: 1,
      classType: 'L',
      subjectName_display: 'Duplicate Subject',
      subjectCode_display: 'DUP101',
      teacherShortNames_display: ['Duplicate Teacher'],
      roomName_display: 'Duplicate Room',
      isActive: true
    });
    
    try {
      await duplicateSlot.save();
      console.log('❌ UNEXPECTED: Duplicate slot was saved (unique constraint not working)');
      return false;
    } catch (error) {
      if (error.code === 11000) {
        console.log('✅ EXPECTED: Duplicate slot rejected by unique constraint');
        return true;
      } else {
        console.log('❌ UNEXPECTED ERROR:', error.message);
        return false;
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing unique constraints:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 SEMESTER GROUP DATABASE TEST');
  console.log('===============================\n');
  
  try {
    // Connect to database
    console.log('1. Connecting to database...');
    await connectDB();
    
    // Clear existing test data
    console.log('\n2. Clearing existing test data...');
    await clearTestData();
    
    // Create test slots
    console.log('\n3. Creating test slots for different semester groups...');
    const slots = await createTestSlots();
    
    if (!slots) {
      console.log('\n❌ TEST FAILED: Could not create slots due to constraint violation');
      console.log('This means the semester group is not properly included in the unique index');
      process.exit(1);
    }
    
    // Verify slots exist
    console.log('\n4. Verifying slots exist...');
    const verifyResult = await verifySlots();
    
    // Test unique constraints
    console.log('\n5. Testing unique constraints...');
    const constraintResult = await testUniqueConstraints();
    
    // Final result
    if (verifyResult && constraintResult) {
      console.log('\n✅ ALL TESTS PASSED: Semester group collision detection is working correctly!');
      console.log('   - Odd and even semester classes can coexist at the same time slot');
      console.log('   - Unique constraints properly prevent duplicate slots within the same semester group');
    } else {
      console.log('\n❌ SOME TESTS FAILED: Semester group collision detection needs attention.');
    }
    
    // Clean up
    await clearTestData();
    console.log('\n🧹 Cleaned up test data');
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  }
}

// Run the test
main().catch(console.error);
