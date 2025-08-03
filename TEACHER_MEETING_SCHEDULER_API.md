# Teacher Meeting Scheduler API Documentation

## Overview
The Teacher Meeting Scheduler API endpoint allows you to find common free time slots for multiple teachers, enabling efficient scheduling of meetings, conferences, or collaborative sessions.

## Endpoint
```
POST /api/teachers/meeting-scheduler
```

## Authentication
Requires a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Request Body

### Required Fields
- `teacherIds` (array): Array of teacher MongoDB ObjectIds (minimum 2 teachers required)

### Optional Fields
- `academicYearId` (string): Academic year ID (if not provided, uses current academic year)
- `minDuration` (integer): Minimum duration in time slots (default: 1, max: 8)
- `excludeDays` (array): Array of day indices to exclude (0=Sunday, 6=Saturday)
- `startDate` (string): Start date for the search period (ISO format)
- `endDate` (string): End date for the search period (ISO format)

### Example Request
```json
{
  "teacherIds": [
    "60d5ecb74b24c12f8c8e4567",
    "60d5ecb74b24c12f8c8e4568",
    "60d5ecb74b24c12f8c8e4569"
  ],
  "minDuration": 2,
  "excludeDays": [6],
  "academicYearId": "60d5ecb74b24c12f8c8e4570"
}
```

## Response Structure

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "searchCriteria": {
      "teacherCount": 3,
      "academicYear": "2024-2025",
      "minDuration": 2,
      "excludeDays": [6],
      "daysSearched": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    },
    "statistics": {
      "totalPossibleSlots": 48,
      "availableMeetingSlots": 12,
      "availabilityPercentage": "25.0"
    },
    "teachers": [
      {
        "teacher": {
          "_id": "60d5ecb74b24c12f8c8e4567",
          "fullName": "Dr. John Smith",
          "shortName": "JS",
          "email": "john.smith@example.com"
        },
        "totalClassesPerWeek": 15,
        "busySlotsCount": 15,
        "departments": ["BCT", "BEI"],
        "subjects": ["Math", "Physics"]
      }
      // ... other teachers
    ],
    "commonFreeSlots": [
      {
        "dayIndex": 1,
        "dayName": "Monday",
        "slotIndex": 3,
        "timeSlot": {
          "_id": "slot-id-123",
          "label": "Third Period",
          "startTime": "10:15",
          "endTime": "11:55",
          "duration": 100
        },
        "availableDuration": 2,
        "confidence": "high",
        "teacherAvailability": [
          {
            "teacherId": "60d5ecb74b24c12f8c8e4567",
            "teacher": {
              "_id": "60d5ecb74b24c12f8c8e4567",
              "fullName": "Dr. John Smith",
              "shortName": "JS"
            },
            "available": true,
            "status": "free"
          }
          // ... other teachers
        ]
      }
      // ... other available slots
    ],
    "recommendations": {
      "bestDays": [
        {
          "dayIndex": 1,
          "dayName": "Monday",
          "availableSlots": 4
        }
        // ... other recommended days
      ],
      "bestTimes": [
        {
          "timeRange": "10:15-11:55",
          "label": "Third Period",
          "count": 3,
          "category": "Morning"
        }
        // ... other recommended times
      ],
      "alternativeOptions": [
        {
          "type": "reschedule_option",
          "dayIndex": 2,
          "dayName": "Tuesday",
          "slotIndex": 4,
          "conflictingTeacher": {
            "_id": "60d5ecb74b24c12f8c8e4567",
            "fullName": "Dr. John Smith"
          },
          "conflictingClass": {
            "subject": "Mathematics",
            "program": "BCT",
            "semester": 3,
            "section": "AB"
          },
          "suggestion": "Consider rescheduling this class to free up the slot for meeting"
        }
        // ... other alternatives
      ]
    }
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "msg": "At least 2 teacher IDs are required"
}
```

#### 400 Bad Request (Validation Error)
```json
{
  "success": false,
  "msg": "One or more teachers not found",
  "missingTeacherIds": ["60d5ecb74b24c12f8c8e4567"]
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "msg": "Server error while finding meeting slots",
  "error": "Detailed error message"
}
```

## Usage Examples

### Basic Usage (2 Teachers)
```javascript
const response = await fetch('/api/teachers/meeting-scheduler', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    teacherIds: [
      "60d5ecb74b24c12f8c8e4567",
      "60d5ecb74b24c12f8c8e4568"
    ]
  })
});

const data = await response.json();
console.log(`Found ${data.data.commonFreeSlots.length} available meeting slots`);
```

### Advanced Usage (Multiple Teachers with Constraints)
```javascript
const response = await fetch('/api/teachers/meeting-scheduler', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    teacherIds: [
      "60d5ecb74b24c12f8c8e4567",
      "60d5ecb74b24c12f8c8e4568",
      "60d5ecb74b24c12f8c8e4569"
    ],
    minDuration: 2, // Need at least 2 consecutive time slots
    excludeDays: [5, 6], // Exclude Friday and Saturday
    academicYearId: "60d5ecb74b24c12f8c8e4570"
  })
});
```

### Processing Results
```javascript
const { data } = response.data;

// Check availability percentage
if (data.statistics.availabilityPercentage > 50) {
  console.log("Good availability for meetings!");
} else {
  console.log("Limited availability, consider alternatives");
}

// Display best meeting times
data.commonFreeSlots.forEach(slot => {
  console.log(`${slot.dayName} ${slot.timeSlot.startTime}-${slot.timeSlot.endTime}`);
});

// Handle no availability
if (data.commonFreeSlots.length === 0) {
  console.log("No common free slots found");
  
  // Check alternatives
  data.recommendations.alternativeOptions.forEach(alt => {
    console.log(`Alternative: ${alt.suggestion}`);
  });
}
```

## Response Field Descriptions

### searchCriteria
- `teacherCount`: Number of teachers included in the search
- `academicYear`: Title of the academic year used for the search
- `minDuration`: Minimum duration requirement used
- `excludeDays`: Days that were excluded from the search
- `daysSearched`: Names of days that were included in the search

### statistics
- `totalPossibleSlots`: Total number of time slots that could potentially be used for meetings
- `availableMeetingSlots`: Number of slots where all teachers are free
- `availabilityPercentage`: Percentage of slots available for meetings

### teachers
Array of teacher objects with their schedule summary:
- `teacher`: Basic teacher information
- `totalClassesPerWeek`: Total number of classes the teacher has per week
- `busySlotsCount`: Number of time slots where the teacher is busy
- `departments`: List of department codes the teacher teaches in
- `subjects`: List of subject codes the teacher teaches

### commonFreeSlots
Array of available meeting slots:
- `dayIndex`: Numeric day index (0=Sunday, 6=Saturday)
- `dayName`: Name of the day
- `slotIndex`: Time slot identifier
- `timeSlot`: Detailed time slot information including start/end times
- `availableDuration`: Number of consecutive free slots available
- `confidence`: Confidence level of the availability (always "high" for this endpoint)
- `teacherAvailability`: Array showing each teacher's availability status

### recommendations
- `bestDays`: Days with the most available meeting slots
- `bestTimes`: Time slots that are most frequently available across days
- `alternativeOptions`: Suggestions when no common slots are found

## Integration Tips

### Frontend Integration
1. Use the provided React component (`TeacherMeetingScheduler.jsx`) as a starting point
2. Implement teacher selection with search/filter capabilities
3. Display results in a calendar or grid view for better visualization
4. Add booking functionality to schedule actual meetings

### Backend Integration
1. Consider caching results for frequently requested teacher combinations
2. Implement notification system for when schedules change
3. Add integration with calendar systems (Google Calendar, Outlook)
4. Store meeting preferences per teacher for better recommendations

### Performance Considerations
1. The endpoint analyzes all teacher schedules - response time increases with more teachers
2. Consider limiting the number of teachers per request (recommended max: 10)
3. Cache teacher schedules to improve response times
4. Use database indexing on `teacherIds`, `dayIndex`, and `slotIndex` fields

## Error Handling

### Common Errors
1. **Invalid teacher IDs**: Ensure all provided teacher IDs exist in the database
2. **No academic year**: Set up at least one academic year with `isCurrentYear: true`
3. **No time slots**: Ensure time slots are configured in the database
4. **Authentication**: Provide a valid JWT token

### Debugging Tips
1. Check server logs for detailed error messages
2. Verify teacher IDs using the `/api/teachers` endpoint
3. Confirm academic year setup using `/api/academic-calendars`
4. Test with a small number of teachers first

## Database Requirements

### Required Collections
- `teachers`: Teacher information and IDs
- `routineslots`: Current teacher schedules
- `timeslots`: Available time slot definitions
- `academiccalendars`: Academic year information

### Required Indexes
```javascript
// Recommended indexes for better performance
db.routineslots.createIndex({ teacherIds: 1, dayIndex: 1, slotIndex: 1 });
db.routineslots.createIndex({ academicYearId: 1, isActive: 1 });
db.teachers.createIndex({ _id: 1, isActive: 1 });
```

## Future Enhancements

### Planned Features
1. **Room Integration**: Find meeting slots considering room availability
2. **Recurring Meetings**: Support for weekly/monthly recurring meeting schedules
3. **Time Zone Support**: Handle teachers in different time zones
4. **Conflict Resolution**: Suggest specific schedule changes to create meeting slots
5. **Integration APIs**: Connect with external calendar systems
6. **Notification System**: Alert teachers when their availability changes

### API Versioning
Current version: `v1`
Future versions will maintain backward compatibility for at least 6 months.
