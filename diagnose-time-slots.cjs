// Diagnostic script to check actual database time slots
// Run this to see what time slots are actually in your database

const mongoose = require('mongoose');

// Simple connection without using the config
async function checkTimeSlots() {
  try {
    // Try to connect to the database
    console.log('🔍 Checking Database Time Slots...');
    console.log('=====================================\n');
    
    // Import the TimeSlot model
    const TimeSlot = require('./backend/models/TimeSlot');
    
    // Check if already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️  Database not connected. Please start your database first.');
      console.log('Run: npm run dev or node backend/server.js');
      return;
    }
    
    // Get time slots
    const timeSlots = await TimeSlot.find().sort({ sortOrder: 1 });
    
    if (timeSlots.length === 0) {
      console.log('❌ No time slots found in database!');
      console.log('This explains why the PDF might have issues.');
      return;
    }
    
    console.log('📅 Actual Database Time Slots:');
    timeSlots.forEach((slot, index) => {
      console.log(`${index}: ${slot.startTime}-${slot.endTime} (ID: ${slot._id}, sortOrder: ${slot.sortOrder}, isBreak: ${slot.isBreak})`);
    });
    
    // Diagnose the issue
    console.log('\n🔍 Diagnosis:');
    if (timeSlots[0].startTime !== '10:15') {
      console.log(`❌ ISSUE FOUND: First time slot is ${timeSlots[0].startTime}, not 10:15`);
      console.log('This explains why classes start at wrong time in PDF');
    } else {
      console.log('✅ First time slot correctly starts at 10:15');
    }
    
    // Check for missing sortOrder
    const missingSortOrder = timeSlots.filter(slot => slot.sortOrder == null);
    if (missingSortOrder.length > 0) {
      console.log(`❌ ISSUE FOUND: ${missingSortOrder.length} time slots missing sortOrder`);
      console.log('This can cause incorrect time slot ordering');
    } else {
      console.log('✅ All time slots have sortOrder values');
    }
    
  } catch (error) {
    console.error('Error checking time slots:', error.message);
    console.log('\n💡 Try running this instead:');
    console.log('1. Start your backend server: npm run dev');
    console.log('2. Then run this diagnostic again');
  }
}

// Give some time for database connection
setTimeout(checkTimeSlots, 1000);
