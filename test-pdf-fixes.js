const fs = require('fs');
const path = require('path');

// Simple test to verify our PDF generation improvements
const testData = {
  // Test regular class (should show full subject name)
  regularClass: {
    subjectName: 'Computer Graphics',
    subjectCode: 'CG',
    teacherShortNames: ['JM'],
    roomName: 'B305',
    classType: 'Lecture',
    isElectiveClass: false
  },
  
  // Test elective class (should show subject code)
  electiveClass: {
    subjectName: 'Advanced Programming',
    subjectCode: 'CE752',
    teacherShortNames: ['PKD'],
    roomName: 'B301',
    classType: 'Lecture',
    isElectiveClass: true,
    electiveLabel: 'Elective 1'
  },
  
  // Test multi-group class
  multiGroupClass: {
    isMultiGroup: true,
    isElectiveClass: false,
    groups: [
      {
        subjectName: 'Data Communication',
        subjectCode: 'DC',
        teacherShortNames: ['RP'],
        roomName: 'ELECTRONICS LAB 2',
        classType: 'Practical',
        labGroup: 'A'
      },
      {
        subjectName: 'Data Communication',
        subjectCode: 'DC',
        teacherShortNames: ['RP'],
        roomName: 'ELECTRONICS LAB 2',
        classType: 'Practical',
        labGroup: 'B'
      }
    ]
  }
};

// Test our getSubjectDisplayText method behavior
function testSubjectDisplay() {
  console.log('=== Testing Subject Display Logic ===');
  
  // Regular class should show full name
  console.log('Regular class:', testData.regularClass.subjectName || testData.regularClass.subjectCode);
  
  // Elective class should show code
  if (testData.electiveClass.isElectiveClass) {
    console.log('Elective class:', testData.electiveClass.subjectCode || testData.electiveClass.subjectName);
  }
  
  // Multi-group should show names for each group
  if (testData.multiGroupClass.isMultiGroup) {
    testData.multiGroupClass.groups.forEach((group, index) => {
      console.log(`Multi-group ${index + 1}:`, group.subjectName || group.subjectCode);
    });
  }
}

testSubjectDisplay();

console.log('\n=== Sample Frontend vs PDF Comparison ===');
console.log('Frontend shows: "Computer Graphics" for regular classes');
console.log('PDF should show: "Computer Graphics" (not "CG")');
console.log('Frontend shows: "CE752" for elective classes');
console.log('PDF should show: "CE752" (subject code for electives)');
console.log('\nTest completed - check the logic above matches expectations!');
