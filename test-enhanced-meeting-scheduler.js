/**
 * Test script for enhanced meeting scheduler API
 * Demonstrates the new detailed unavailability information
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:7102';

async function testEnhancedMeetingScheduler() {
  try {
    console.log('🧪 Testing Enhanced Meeting Scheduler API');
    console.log('========================================\n');

    // Sample request - you'll need to replace with actual teacher IDs from your database
    const requestData = {
      teacherIds: [
        "60f5b1234567890123456789", // Replace with actual teacher IDs
        "60f5b1234567890123456790"
      ],
      minDuration: 1,
      excludeDays: [0, 6] // Exclude Sunday and Saturday
    };

    console.log('📤 Request payload:');
    console.log(JSON.stringify(requestData, null, 2));
    console.log('\n');

    const response = await fetch(`${API_BASE_URL}/api/teachers/meeting-scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if required
        // 'Authorization': 'Bearer your-token-here'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', response.status, errorData);
      return;
    }

    const result = await response.json();
    
    console.log('✅ API Response received successfully!\n');
    
    // Display enhanced unavailability information
    console.log('📊 UNAVAILABILITY STATISTICS:');
    console.log('============================');
    if (result.data.unavailabilityStats) {
      const stats = result.data.unavailabilityStats;
      console.log(`Total Unavailable Slots: ${stats.totalUnavailableSlots}`);
      console.log(`Fully Unavailable: ${stats.fullyUnavailableSlots}`);
      console.log(`Partially Unavailable: ${stats.partiallyUnavailableSlots}`);
      if (stats.mostBusyTeacher) {
        console.log(`Most Busy Teacher: ${stats.mostBusyTeacher.fullName} (${stats.mostBusyTeacher.busySlotCount} conflicts)`);
      }
    }
    console.log('\n');

    // Display detailed busy slots with teacher commitments
    console.log('🚫 UNAVAILABLE SLOTS WITH TEACHER DETAILS:');
    console.log('==========================================');
    if (result.data.busySlots && result.data.busySlots.length > 0) {
      result.data.busySlots.slice(0, 5).forEach((slot, index) => { // Show first 5 for demo
        console.log(`\n${index + 1}. ${slot.dayName} - ${slot.timeSlot.label} (${slot.timeSlot.startTime} - ${slot.timeSlot.endTime})`);
        console.log(`   Conflict Severity: ${slot.conflictSeverity.toUpperCase()}`);
        console.log(`   Teachers Busy: ${slot.busyTeachersCount}/${slot.totalTeachersRequested}`);
        
        slot.busyTeachers.forEach(teacher => {
          console.log(`\n   📚 ${teacher.teacher.fullName} is unavailable because:`);
          console.log(`      Reason: ${teacher.unavailabilityReason}`);
          if (teacher.commitments && teacher.commitments.length > 0) {
            teacher.commitments.forEach(commitment => {
              console.log(`      📖 ${commitment.classType}: ${commitment.subject} (${commitment.subjectCode})`);
              console.log(`         Program: ${commitment.program} (${commitment.programCode})`);
              console.log(`         Class: ${commitment.semester}-${commitment.section}${commitment.group ? `-${commitment.group}` : ''}`);
              if (commitment.labGroup) console.log(`         Lab Group: ${commitment.labGroup}`);
              if (commitment.electiveGroup) console.log(`         Elective Group: ${commitment.electiveGroup}`);
            });
          }
        });

        if (slot.availableTeachers.length > 0) {
          console.log(`\n   ✅ Available Teachers: ${slot.availableTeachers.map(t => t.teacher.fullName).join(', ')}`);
        }
      });

      if (result.data.busySlots.length > 5) {
        console.log(`\n   ... and ${result.data.busySlots.length - 5} more unavailable slots`);
      }
    } else {
      console.log('   No unavailable slots found!');
    }
    console.log('\n');

    // Display available slots for comparison
    console.log('✅ AVAILABLE MEETING SLOTS:');
    console.log('===========================');
    if (result.data.commonFreeSlots && result.data.commonFreeSlots.length > 0) {
      result.data.commonFreeSlots.slice(0, 3).forEach((slot, index) => {
        console.log(`${index + 1}. ${slot.dayName} - ${slot.timeSlot.label} (${slot.timeSlot.startTime} - ${slot.timeSlot.endTime})`);
        console.log(`   Duration: ${slot.availableDuration} period(s)`);
        console.log(`   All ${slot.teacherAvailability.length} teachers available`);
      });
      
      if (result.data.commonFreeSlots.length > 3) {
        console.log(`   ... and ${result.data.commonFreeSlots.length - 3} more available slots`);
      }
    } else {
      console.log('   No common free slots found!');
    }
    console.log('\n');

    // Display overall statistics
    console.log('📈 OVERALL STATISTICS:');
    console.log('=====================');
    const stats = result.data.statistics;
    console.log(`Total Possible Slots: ${stats.totalPossibleSlots}`);
    console.log(`Available Slots: ${stats.availableMeetingSlots} (${stats.availabilityPercentage}%)`);
    console.log(`Unavailable Slots: ${stats.unavailableMeetingSlots} (${stats.unavailabilityPercentage}%)`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔧 Make sure the backend server is running on port 7102');
    console.error('🔧 Check that you have valid teacher IDs in the request');
  }
}

// Run the test
if (require.main === module) {
  testEnhancedMeetingScheduler();
}

module.exports = { testEnhancedMeetingScheduler };
