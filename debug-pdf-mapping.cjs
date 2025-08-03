const mongoose = require('mongoose');
const RoutineSlot = require('./backend/models/RoutineSlot');
const TimeSlot = require('./backend/models/TimeSlot');

async function debugPDFMapping() {
  try {
    await mongoose.connect('mongodb://localhost:27017/routine_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('🔍 Debugging PDF mapping issues...\n');

    // 1. Check TimeSlots order
    console.log('=== TIME SLOTS ===');
    const timeSlots = await TimeSlot.find().sort({ order: 1 });
    console.log(`Found ${timeSlots.length} time slots`);
    timeSlots.forEach((ts, index) => {
      console.log(`Index ${index}: _id=${ts._id}, ${ts.startTime}-${ts.endTime}, order=${ts.order}, sortOrder=${ts.sortOrder}`);
    });

    // 2. Check specific routine data for BCT 5 AB
    console.log('\n=== BCT 5 AB ROUTINE SLOTS ===');
    const routineSlots = await RoutineSlot.find({
      programCode: 'BCT',
      semester: 5,
      section: 'AB',
      isActive: true
    })
      .populate('subjectId', 'name code')
      .populate('subjectIds', 'name code')
      .populate('teacherIds', 'fullName shortName')
      .populate('roomId', 'name')
      .sort({ dayIndex: 1, slotIndex: 1 });

    console.log(`Found ${routineSlots.length} routine slots for BCT-5-AB`);
    
    // Group by day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    for (let dayIndex = 0; dayIndex < 6; dayIndex++) {
      const daySlots = routineSlots.filter(slot => slot.dayIndex === dayIndex);
      console.log(`\n${dayNames[dayIndex]} (dayIndex ${dayIndex}):`);
      
      daySlots.forEach(slot => {
        const timeSlot = timeSlots[slot.slotIndex];
        const timeSlotId = timeSlot ? timeSlot._id.toString() : 'NOT_FOUND';
        const timeRange = timeSlot ? `${timeSlot.startTime}-${timeSlot.endTime}` : 'N/A';
        
        console.log(`  slotIndex ${slot.slotIndex} -> TimeSlot ${timeSlotId} (${timeRange})`);
        console.log(`    Subject: ${slot.subjectId?.code || 'N/A'}`);
        console.log(`    Teachers: ${slot.teacherIds?.map(t => t.shortName).join(', ') || 'N/A'}`);
        console.log(`    Room: ${slot.roomId?.name || 'N/A'}`);
        console.log(`    Class Type: ${slot.classType}`);
        console.log(`    Display Data:`, {
          subjectName: slot.subjectName,
          subjectCode_display: slot.subjectCode_display,
          teacherShortNames_display: slot.teacherShortNames_display,
          roomName_display: slot.roomName_display
        });
        console.log('');
      });
    }

    // 3. Check Monday specifically (issues visible in PDF)
    console.log('\n=== MONDAY DETAILED ANALYSIS ===');
    const mondaySlots = routineSlots.filter(slot => slot.dayIndex === 1);
    console.log(`Monday has ${mondaySlots.length} slots`);
    
    // Create the same mapping as PDF service
    const routineMap = new Map();
    
    mondaySlots.forEach(slot => {
      if (slot.slotIndex !== undefined && timeSlots[slot.slotIndex]) {
        const timeSlotId = timeSlots[slot.slotIndex]._id.toString();
        const key = `${slot.dayIndex}-${timeSlotId}`;
        
        if (!routineMap.has(key)) {
          routineMap.set(key, []);
        }
        routineMap.get(key).push(slot);
        
        console.log(`Mapped: ${key} -> ${slot.subjectId?.code || 'N/A'}`);
      }
    });

    // 4. Check what should be at 10:15-11:05
    console.log('\n=== CHECKING 10:15-11:05 SLOT ===');
    const targetTimeSlot = timeSlots.find(ts => ts.startTime === '10:15' && ts.endTime === '11:05');
    if (targetTimeSlot) {
      console.log(`Target time slot found: _id=${targetTimeSlot._id}, index in array=${timeSlots.indexOf(targetTimeSlot)}`);
      
      const mondayKey = `1-${targetTimeSlot._id.toString()}`;
      const slotsAtTime = routineMap.get(mondayKey);
      console.log(`Slots at Monday 10:15-11:05:`, slotsAtTime?.map(s => s.subjectId?.code) || 'NONE');
      
      // Check if there are any slots with slotIndex matching this timeSlot's position
      const expectedSlotIndex = timeSlots.indexOf(targetTimeSlot);
      const slotsWithThisIndex = mondaySlots.filter(s => s.slotIndex === expectedSlotIndex);
      console.log(`Slots with slotIndex ${expectedSlotIndex}:`, slotsWithThisIndex.map(s => s.subjectId?.code));
    } else {
      console.log('10:15-11:05 time slot not found in database!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugPDFMapping();
