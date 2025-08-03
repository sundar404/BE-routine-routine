#!/usr/bin/env node
/**
 * Find all teacher scheduling conflicts in the database
 */

const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = 'mongodb+srv://079bct044manish:routine@routine.mrjj7ho.mongodb.net/bctroutine?retryWrites=true&w=majority&appName=routine';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// RoutineSlot schema (simplified)
const routineSlotSchema = new mongoose.Schema({
  teacherIds: [String],
  dayIndex: Number,
  slotIndex: Number,
  semester: Number,
  semesterGroup: String,
  subjectName: String,
  programCode: String,
  section: String,
  academicYearId: String,
  isActive: Boolean
}, { timestamps: true });

const RoutineSlot = mongoose.model('RoutineSlot', routineSlotSchema);

async function findTeacherConflicts() {
  console.log('=== Finding Teacher Scheduling Conflicts ===\n');
  
  try {
    // Get all active routine slots
    const slots = await RoutineSlot.find({ isActive: true }).sort({
      dayIndex: 1,
      slotIndex: 1,
      'teacherIds.0': 1
    });
    
    console.log(`Found ${slots.length} active routine slots`);
    
    // Group by teacher, day, and slot to find conflicts
    const conflicts = {};
    
    slots.forEach(slot => {
      slot.teacherIds.forEach(teacherId => {
        const key = `${teacherId}_${slot.dayIndex}_${slot.slotIndex}`;
        
        if (!conflicts[key]) {
          conflicts[key] = [];
        }
        
        conflicts[key].push({
          id: slot._id,
          subject: slot.subjectName,
          semester: slot.semester,
          semesterGroup: slot.semester % 2 === 1 ? 'odd' : 'even',
          program: slot.programCode,
          section: slot.section,
          dayIndex: slot.dayIndex,
          slotIndex: slot.slotIndex,
          teacherId: teacherId
        });
      });
    });
    
    // Find actual conflicts (same teacher, same time, multiple classes)
    let conflictCount = 0;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    console.log('\n🔍 Checking for conflicts...\n');
    
    for (const [key, classes] of Object.entries(conflicts)) {
      if (classes.length > 1) {
        const [teacherId, dayIndex, slotIndex] = key.split('_');
        
        // Check if any are in the same semester group
        const oddClasses = classes.filter(c => c.semesterGroup === 'odd');
        const evenClasses = classes.filter(c => c.semesterGroup === 'even');
        
        let hasConflict = false;
        
        if (oddClasses.length > 1) {
          console.log(`🔴 CONFLICT #${++conflictCount}: Multiple ODD semester classes for same teacher/time`);
          hasConflict = true;
        }
        
        if (evenClasses.length > 1) {
          console.log(`🔴 CONFLICT #${++conflictCount}: Multiple EVEN semester classes for same teacher/time`);
          hasConflict = true;
        }
        
        if (hasConflict) {
          console.log(`   Teacher ID: ${teacherId}`);
          console.log(`   Time: ${days[dayIndex]} slot ${slotIndex}`);
          console.log(`   Classes:`);
          
          classes.forEach((cls, i) => {
            console.log(`     ${i+1}. ${cls.subject} (${cls.program} Sem${cls.semester} ${cls.section}) - ${cls.semesterGroup} group`);
          });
          console.log('');
        }
      }
    }
    
    if (conflictCount === 0) {
      console.log('✅ No teacher scheduling conflicts found!');
    } else {
      console.log(`❌ Found ${conflictCount} teacher scheduling conflicts that need to be resolved.`);
    }
    
  } catch (error) {
    console.error('Error finding conflicts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the conflict finder
connectDB().then(() => {
  findTeacherConflicts();
});
