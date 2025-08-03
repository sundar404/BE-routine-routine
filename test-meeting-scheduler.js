/**
 * Test script for Teacher Meeting Scheduler API
 * Usage: node test-meeting-scheduler.js
 */

import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://localhost:7102';
const TEST_ENDPOINT = '/api/teachers/meeting-scheduler';

// Test data - you should replace these with actual teacher IDs from your database
const testData = {
  teacherIds: [
    '686de901d10683aabdc31e51', // Replace with actual teacher ID 1
    '686de901d10683aabdc31e52'  // Replace with actual teacher ID 2
  ],
  minDuration: 1,
  excludeDays: [6] // Exclude Saturday
};

async function testMeetingScheduler() {
  try {
    console.log('🚀 Testing Teacher Meeting Scheduler API...\n');
    console.log('📊 Test Data:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}${TEST_ENDPOINT}`, testData, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN' // Add if authentication is required
      }
    });
    
    console.log('\n✅ API Response Status:', response.status);
    console.log('📋 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Analyze results
    const { data } = response.data;
    if (data) {
      console.log('\n📈 Analysis:');
      console.log(`👥 Teachers analyzed: ${data.searchCriteria.teacherCount}`);
      console.log(`🎯 Available meeting slots: ${data.statistics.availableMeetingSlots}`);
      console.log(`📊 Availability percentage: ${data.statistics.availabilityPercentage}%`);
      
      if (data.commonFreeSlots.length > 0) {
        console.log('\n🎉 Best meeting times:');
        data.commonFreeSlots.slice(0, 5).forEach((slot, index) => {
          console.log(`${index + 1}. ${slot.dayName} ${slot.timeSlot.startTime}-${slot.timeSlot.endTime} (${slot.timeSlot.label})`);
        });
      } else {
        console.log('\n⚠️  No common free slots found');
        if (data.recommendations.alternativeOptions.length > 0) {
          console.log('💡 Alternative suggestions:');
          data.recommendations.alternativeOptions.forEach((alt, index) => {
            console.log(`${index + 1}. ${alt.suggestion} - ${alt.dayName} ${alt.conflictingClass.subject}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Helper function to test with sample data from database
async function getTestTeacherIds() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/teachers?limit=5`);
    const teachers = response.data.data || response.data.teachers || [];
    
    if (teachers.length >= 2) {
      console.log('📝 Available teachers for testing:');
      teachers.slice(0, 5).forEach((teacher, index) => {
        console.log(`${index + 1}. ${teacher.fullName} (${teacher.shortName}) - ID: ${teacher._id}`);
      });
      
      return teachers.slice(0, 2).map(t => t._id);
    } else {
      console.log('⚠️  Not enough teachers found in database for testing');
      return null;
    }
  } catch (error) {
    console.log('⚠️  Could not fetch teachers from database. Using provided test IDs...');
    return null;
  }
}

// Main execution
async function main() {
  console.log('🔍 Attempting to fetch test teacher IDs from database...\n');
  
  const fetchedTeacherIds = await getTestTeacherIds();
  if (fetchedTeacherIds) {
    testData.teacherIds = fetchedTeacherIds;
    console.log('\n✅ Using fetched teacher IDs for testing\n');
  } else {
    console.log('\n⚠️  Using provided test teacher IDs (update these with real IDs from your database)\n');
  }
  
  await testMeetingScheduler();
}

// Run the test
main();

export { testMeetingScheduler, getTestTeacherIds };
