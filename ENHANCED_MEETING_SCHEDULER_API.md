# Enhanced Meeting Scheduler API Documentation

## Overview
The `/api/teachers/meeting-scheduler` endpoint has been enhanced to provide detailed information about teacher unavailability, including specific commitments, class details, and conflict analysis.

## API Endpoint
**POST** `/api/teachers/meeting-scheduler`

## Enhanced Response Structure

### New Fields Added

#### 1. Enhanced `busySlots` Array
Each busy slot now includes detailed teacher commitment information:

```javascript
{
  "busySlots": [
    {
      "dayIndex": 1,
      "dayName": "Monday", 
      "slotIndex": "507f1f77bcf86cd799439011",
      "timeSlot": {
        "_id": "507f1f77bcf86cd799439011",
        "label": "Period 1",
        "startTime": "09:00",
        "endTime": "10:00",
        "duration": 60
      },
      "busyTeachers": [
        {
          "teacherId": "507f1f77bcf86cd799439012",
          "teacher": {
            "_id": "507f1f77bcf86cd799439012",
            "fullName": "Dr. John Smith",
            "shortName": "JS",
            "email": "john.smith@college.edu"
          },
          "available": false,
          "status": "busy",
          "commitments": [
            {
              "subject": "Database Management Systems",
              "subjectCode": "DBMS501",
              "program": "Bachelor of Computer Technology",
              "programCode": "BCT",
              "semester": "5",
              "section": "A",
              "group": null,
              "labGroup": "L1",
              "electiveGroup": null,
              "routineSlotId": "507f1f77bcf86cd799439013",
              "classType": "Lab"
            }
          ],
          "unavailabilityReason": "Teaching DBMS501 (BCT-5-A)"
        }
      ],
      "availableTeachers": [
        {
          "teacherId": "507f1f77bcf86cd799439014",
          "teacher": {
            "_id": "507f1f77bcf86cd799439014",
            "fullName": "Prof. Jane Doe",
            "shortName": "JD",
            "email": "jane.doe@college.edu"
          },
          "available": true,
          "status": "free"
        }
      ],
      "conflictSeverity": "partial",
      "totalTeachersRequested": 2,
      "busyTeachersCount": 1,
      "availableTeachersCount": 1
    }
  ]
}
```

#### 2. New `unavailabilityStats` Object
Provides summary statistics about teacher unavailability:

```javascript
{
  "unavailabilityStats": {
    "totalUnavailableSlots": 15,
    "fullyUnavailableSlots": 8,
    "partiallyUnavailableSlots": 7,
    "mostBusyTeacher": {
      "_id": "507f1f77bcf86cd799439012",
      "fullName": "Dr. John Smith",
      "shortName": "JS",
      "email": "john.smith@college.edu",
      "busySlotCount": 12
    }
  }
}
```

#### 3. Enhanced `statistics` Object
Now includes unavailability metrics:

```javascript
{
  "statistics": {
    "totalPossibleSlots": 30,
    "availableMeetingSlots": 8,
    "unavailableMeetingSlots": 15,
    "availabilityPercentage": "26.7",
    "unavailabilityPercentage": "50.0"
  }
}
```

## Key Enhancements

### 1. Teacher Commitment Details
For each unavailable teacher, the API now provides:
- **Subject Information**: Full name and code
- **Program Details**: Program name and code
- **Class Specifics**: Semester, section, group information
- **Class Type**: Theory, Lab, or Elective
- **Lab/Elective Groups**: When applicable
- **Routine Slot ID**: For reference and potential rescheduling

### 2. Conflict Severity Analysis
- **`high`**: All requested teachers are busy
- **`partial`**: Some teachers are busy, others are available

### 3. Unavailability Reasons
Human-readable explanations like:
- `"Teaching DBMS501 (BCT-5-A)"`
- `"Teaching MATH301 (BEI-3-B), PHYS201 (BCT-2-A)"`

### 4. Teacher Statistics
Identifies the most busy teacher with their conflict count.

## Usage Examples

### Frontend Integration
```javascript
// Fetch meeting slots with enhanced unavailability info
const response = await fetch('/api/teachers/meeting-scheduler', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    teacherIds: ['teacher1_id', 'teacher2_id'],
    minDuration: 1,
    excludeDays: [0, 6]
  })
});

const data = await response.json();

// Display unavailable slots with teacher commitments
data.data.busySlots.forEach(slot => {
  console.log(`${slot.dayName} ${slot.timeSlot.label}: ${slot.busyTeachersCount}/${slot.totalTeachersRequested} teachers busy`);
  
  slot.busyTeachers.forEach(teacher => {
    console.log(`  ${teacher.teacher.fullName}: ${teacher.unavailabilityReason}`);
    teacher.commitments.forEach(commitment => {
      console.log(`    - ${commitment.classType}: ${commitment.subject} (${commitment.programCode}-${commitment.semester}-${commitment.section})`);
    });
  });
});
```

### Alternative Meeting Suggestions
```javascript
// Use unavailability data to suggest alternatives
const partialConflicts = data.data.busySlots.filter(slot => 
  slot.conflictSeverity === 'partial'
);

console.log(`Found ${partialConflicts.length} slots where only some teachers are busy`);
```

## Benefits

1. **Better Decision Making**: Detailed commitment information helps in rescheduling decisions
2. **Conflict Resolution**: Understanding why teachers are unavailable enables better planning
3. **Resource Optimization**: Identify patterns in teacher availability
4. **User Experience**: Provide meaningful explanations to users about scheduling conflicts
5. **Alternative Planning**: Use partial conflict information to suggest modified meeting arrangements

## Testing

Use the provided test script:
```bash
node test-enhanced-meeting-scheduler.js
```

Make sure to:
1. Update teacher IDs with actual values from your database
2. Start the backend server on port 7102
3. Have valid authentication tokens if required

## Backward Compatibility

All existing fields remain unchanged. The enhancement only adds new fields:
- `commitments` array in `busyTeachers`
- `unavailabilityReason` string in `busyTeachers`
- `conflictSeverity`, `totalTeachersRequested`, `busyTeachersCount`, `availableTeachersCount` in busy slots
- `unavailabilityStats` object at top level
- `unavailableMeetingSlots` and `unavailabilityPercentage` in statistics

Existing clients will continue to work without modification.
