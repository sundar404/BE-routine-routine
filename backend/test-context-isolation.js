const mongoose = require('mongoose');
const TimeSlot = require('./models/TimeSlot');

async function testContextIsolation() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/routine-db');
    console.log('📊 Testing Time Slot Context Isolation');
    console.log('='.repeat(60));
    
    // 1. Get all time slots to see what we have
    const allTimeSlots = await TimeSlot.find({}).sort({ _id: 1 });
    console.log('\n🔍 ALL TIME SLOTS IN DATABASE:');
    console.log('-'.repeat(40));
    allTimeSlots.forEach(slot => {
      const context = slot.isGlobal ? 'Global' : `${slot.programCode}-${slot.semester}-${slot.section}`;
      console.log(`  ID: ${slot._id.toString().padEnd(3)} | ${slot.startTime}-${slot.endTime} | ${context}`);
    });
    
    // 2. Test filtering for BCT-5-AB (includes global + BCT-5-AB specific)
    console.log('\n🎯 TIME SLOTS FOR BCT-5-AB:');
    console.log('-'.repeat(40));
    const bct5AbFilter = {
      $or: [
        { isGlobal: true },
        { isGlobal: { $exists: false } },
        { isGlobal: null },
        { 
          isGlobal: false,
          programCode: 'BCT',
          semester: 5,
          section: 'AB'
        }
      ]
    };
    
    const bct5AbSlots = await TimeSlot.find(bct5AbFilter).sort({ sortOrder: 1 });
    bct5AbSlots.forEach(slot => {
      const context = slot.isGlobal ? 'Global' : `${slot.programCode}-${slot.semester}-${slot.section}`;
      console.log(`  ID: ${slot._id.toString().padEnd(3)} | ${slot.startTime}-${slot.endTime} | ${context}`);
    });
    
    // 3. Test filtering for BCT-2-AB (includes global + BCT-2-AB specific, should NOT show BCT-5-AB)
    console.log('\n🎯 TIME SLOTS FOR BCT-2-AB:');
    console.log('-'.repeat(40));
    const bct2AbFilter = {
      $or: [
        { isGlobal: true },
        { isGlobal: { $exists: false } },
        { isGlobal: null },
        { 
          isGlobal: false,
          programCode: 'BCT',
          semester: 2,
          section: 'AB'
        }
      ]
    };
    
    const bct2AbSlots = await TimeSlot.find(bct2AbFilter).sort({ sortOrder: 1 });
    bct2AbSlots.forEach(slot => {
      const context = slot.isGlobal ? 'Global' : `${slot.programCode}-${slot.semester}-${slot.section}`;
      console.log(`  ID: ${slot._id.toString().padEnd(3)} | ${slot.startTime}-${slot.endTime} | ${context}`);
    });
    
    // 4. Create a demonstration context-specific time slot for BCT-5-AB
    console.log('\n🆕 CREATING DEMO TIME SLOT FOR BCT-5-AB...');
    console.log('-'.repeat(40));
    
    const demoSlot = {
      _id: 999, // Demo ID
      label: 'Demo Early Morning',
      startTime: '07:00',
      endTime: '10:15',
      sortOrder: 1,
      programCode: 'BCT',
      semester: 5,
      section: 'AB',
      isGlobal: false,
      category: 'Morning'
    };
    
    // Check if demo slot already exists
    const existingDemo = await TimeSlot.findOne({ _id: 999 });
    if (existingDemo) {
      console.log('  Demo slot already exists, skipping creation');
    } else {
      const newSlot = new TimeSlot(demoSlot);
      await newSlot.save();
      console.log(`  ✅ Created: ${newSlot.startTime}-${newSlot.endTime} for BCT-5-AB only`);
    }
    
    // 5. Verify isolation - check if demo slot appears in different contexts
    console.log('\n🔍 VERIFYING ISOLATION AFTER DEMO CREATION:');
    console.log('-'.repeat(50));
    
    const bct5AbAfter = await TimeSlot.find(bct5AbFilter).sort({ sortOrder: 1 });
    const bct2AbAfter = await TimeSlot.find(bct2AbFilter).sort({ sortOrder: 1 });
    
    const bct5AbHasDemo = bct5AbAfter.some(slot => slot._id === 999);
    const bct2AbHasDemo = bct2AbAfter.some(slot => slot._id === 999);
    
    console.log(`  BCT-5-AB sees demo slot: ${bct5AbHasDemo ? '✅ YES' : '❌ NO'}`);
    console.log(`  BCT-2-AB sees demo slot: ${bct2AbHasDemo ? '❌ YES (PROBLEM!)' : '✅ NO (CORRECT)'}`);
    
    if (bct5AbHasDemo && !bct2AbHasDemo) {
      console.log('\n🎉 CONTEXT ISOLATION WORKING CORRECTLY!');
      console.log('   Context-specific time slots are properly isolated.');
    } else {
      console.log('\n⚠️  CONTEXT ISOLATION MAY HAVE ISSUES');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testContextIsolation();
