/**
 * Test the Teacher Meeting Scheduler API with actual authentication
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:7102';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjg2NDFkNzU4ZWFiNmFlZjMyYWVmNDEyIiwicm9sZSI6ImFkbWluIn0sImlhdCI6MTc1MzY4NjQxMCwiZXhwIjoxNzU2Mjc4NDEwfQ.2VHTwXZzQLldQQnoenm4-oSnlw8jd8Gd2gsUdRzKVBM';

async function testWithAuth() {
  try {
    console.log('🔑 Testing with provided JWT token...\n');
    
    // First, let's get some teachers to use in our test
    console.log('📋 Fetching teachers...');
    const teachersResponse = await fetch(`${API_BASE_URL}/api/teachers`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!teachersResponse.ok) {
      throw new Error(`Failed to fetch teachers: ${teachersResponse.status} ${teachersResponse.statusText}`);
    }

    const teachersData = await teachersResponse.json();
    const teachers = teachersData.data || teachersData.teachers || teachersData || [];
    
    console.log(`✅ Found ${teachers.length} teachers`);
    
    if (teachers.length < 2) {
      console.log('⚠️  Need at least 2 teachers to test meeting scheduler');
      return;
    }

    // Show available teachers
    console.log('\n👥 Available Teachers:');
    teachers.slice(0, 5).forEach((teacher, index) => {
      console.log(`${index + 1}. ${teacher.fullName} (${teacher.shortName}) - ${teacher._id}`);
    });

    // Test the meeting scheduler with the first 2 teachers
    const testTeacherIds = teachers.slice(0, 2).map(t => t._id);
    
    const testRequest = {
      teacherIds: testTeacherIds,
      minDuration: 1,
      excludeDays: [6] // Exclude Saturday
    };

    console.log('\n🔍 Testing Meeting Scheduler API...');
    console.log('📤 Request:', JSON.stringify(testRequest, null, 2));

    const response = await fetch(`${API_BASE_URL}/api/teachers/meeting-scheduler`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', responseData);
      return;
    }

    console.log('\n✅ API Response:');
    console.log(JSON.stringify(responseData, null, 2));

    // Analyze the results
    if (responseData.success && responseData.data) {
      const { data } = responseData;
      
      console.log('\n📊 Analysis Summary:');
      console.log(`👥 Teachers analyzed: ${data.searchCriteria.teacherCount}`);
      console.log(`📅 Available meeting slots: ${data.statistics.availableMeetingSlots}`);
      console.log(`📈 Availability percentage: ${data.statistics.availabilityPercentage}%`);
      
      if (data.commonFreeSlots.length > 0) {
        console.log('\n🎯 Available Meeting Times:');
        data.commonFreeSlots.slice(0, 5).forEach((slot, index) => {
          console.log(`${index + 1}. ${slot.dayName} ${slot.timeSlot.startTime}-${slot.timeSlot.endTime} (${slot.timeSlot.label})`);
        });
      } else {
        console.log('\n⚠️  No common free slots found');
        
        if (data.recommendations.alternativeOptions.length > 0) {
          console.log('\n💡 Alternative Suggestions:');
          data.recommendations.alternativeOptions.forEach((alt, index) => {
            console.log(`${index + 1}. ${alt.suggestion}`);
            console.log(`   - Class: ${alt.conflictingClass.subject} (${alt.conflictingClass.program})`);
          });
        }
      }

      if (data.recommendations.bestDays.length > 0) {
        console.log('\n📅 Best Days for Meetings:');
        data.recommendations.bestDays.forEach((day, index) => {
          console.log(`${index + 1}. ${day.dayName} (${day.availableSlots} slots available)`);
        });
      }
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('\n💻 You can now access the web interface at: http://localhost:7103/teacher-meeting-scheduler');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', await error.response.text());
    }
  }
}

// Run the test
if (require.main === module) {
  testWithAuth();
}

module.exports = { testWithAuth };
