// Diagnostic script to check if classes are assigned in the database
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const mongoose = require('mongoose');

async function checkRoutineAssignments() {
  console.log('🔍 Checking Routine Assignments in Database...');
  console.log('===============================================\n');
  
  try {
    // Connect to database if not already connected
    if (mongoose.connection.readyState !== 1) {
      const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
      if (!mongoURI) {
        console.log('❌ MongoDB URI not found in environment variables');
        return;
      }
      
      console.log('🔗 Connecting to database...');
      await mongoose.connect(mongoURI);
      console.log('✅ Database connected successfully');
    }
    
    // Import models
    const RoutineSlot = require('./backend/models/RoutineSlot');
    const TimeSlot = require('./backend/models/TimeSlot');
    
    console.log('✅ Database connected');
    
    // Check for any routine slots
    const totalSlots = await RoutineSlot.countDocuments();
    console.log(`📊 Total routine slots in database: ${totalSlots}`);
    
    if (totalSlots === 0) {
      console.log('\n❌ NO CLASSES ASSIGNED!');
      console.log('This explains why you don\'t see any classes in the frontend.');
      console.log('\nTo fix this:');
      console.log('1. Go to your frontend routine grid');
      console.log('2. Click on empty cells to assign classes');
      console.log('3. Or import routine data if you have it');
      return;
    }
    
    // Check programs and sections
    console.log('\n📚 Programs and Sections with assigned classes:');
    const programs = await RoutineSlot.distinct('programCode');
    console.log('Programs:', programs);
    
    for (const program of programs) {
      const sections = await RoutineSlot.distinct('section', { programCode: program });
      console.log(`${program} sections:`, sections);
      
      for (const section of sections) {
        const semesters = await RoutineSlot.distinct('semester', { 
          programCode: program, 
          section: section 
        });
        console.log(`  ${program}-${section} semesters:`, semesters);
        
        // Get sample classes for this program-section
        const sampleClasses = await RoutineSlot.find({
          programCode: program,
          section: section
        })
        .populate('subjectId', 'name code')
        .populate('teacherIds', 'shortName')
        .populate('roomId', 'name')
        .limit(3);
        
        console.log(`  Sample classes for ${program}-${section}:`);
        sampleClasses.forEach(slot => {
          console.log(`    Day ${slot.dayIndex}, Slot ${slot.slotIndex}: ${slot.subjectId?.name || 'Unknown'} (${slot.classType})`);
        });
      }
    }
    
    // Check time slots
    console.log('\n⏰ Time Slots:');
    const timeSlots = await TimeSlot.find().sort({ sortOrder: 1 });
    console.log(`Total time slots: ${timeSlots.length}`);
    
    if (timeSlots.length === 0) {
      console.log('❌ NO TIME SLOTS DEFINED!');
      console.log('This will cause frontend issues. You need to create time slots first.');
    } else {
      console.log('First few time slots:');
      timeSlots.slice(0, 5).forEach((slot, idx) => {
        console.log(`  ${idx}: ${slot.startTime}-${slot.endTime} (sortOrder: ${slot.sortOrder})`);
      });
    }
    
    // Check for specific program (common ones)
    const commonPrograms = ['BCT', 'BEI', 'BCE'];
    const commonSections = ['AB', 'CD'];
    
    console.log('\n🎯 Checking common program-section combinations:');
    for (const prog of commonPrograms) {
      for (const sect of commonSections) {
        const count = await RoutineSlot.countDocuments({
          programCode: prog,
          section: sect
        });
        if (count > 0) {
          console.log(`✅ ${prog}-${sect}: ${count} classes assigned`);
        } else {
          console.log(`❌ ${prog}-${sect}: No classes assigned`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking routine assignments:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. Database is running (MongoDB)');
    console.log('2. Backend server is started');
    console.log('3. Database connection is working');
  }
}

// Give database time to connect if needed
setTimeout(checkRoutineAssignments, 1000);
