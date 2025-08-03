# Teacher Meeting Scheduler - Quick Start Guide

## Overview
The Teacher Meeting Scheduler endpoint helps you find common free time slots when multiple teachers are available for meetings, conferences, or collaborative sessions.

## Quick Example

### 1. Find Basic Meeting Slots
```bash
curl -X POST http://localhost:7102/api/teachers/meeting-scheduler \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "teacherIds": [
      "TEACHER_ID_1",
      "TEACHER_ID_2"
    ]
  }'
```

### 2. Advanced Search with Constraints
```bash
curl -X POST http://localhost:7102/api/teachers/meeting-scheduler \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "teacherIds": [
      "TEACHER_ID_1",
      "TEACHER_ID_2",
      "TEACHER_ID_3"
    ],
    "minDuration": 2,
    "excludeDays": [5, 6]
  }'
```

## Getting Teacher IDs

First, get a list of available teachers:

```bash
curl -X GET http://localhost:7102/api/teachers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This will return a list of teachers with their IDs that you can use in the meeting scheduler.

## Understanding the Response

### Example Response
```json
{
  "success": true,
  "data": {
    "statistics": {
      "availableMeetingSlots": 8,
      "availabilityPercentage": "33.3"
    },
    "commonFreeSlots": [
      {
        "dayName": "Monday",
        "timeSlot": {
          "startTime": "10:15",
          "endTime": "11:55",
          "label": "Third Period"
        },
        "availableDuration": 1
      }
    ],
    "recommendations": {
      "bestDays": [
        {
          "dayName": "Monday",
          "availableSlots": 4
        }
      ]
    }
  }
}
```

### Key Response Fields
- **availableMeetingSlots**: Number of time slots where all teachers are free
- **availabilityPercentage**: Percentage of total slots available for meetings
- **commonFreeSlots**: Array of specific available time slots
- **bestDays**: Days with the most available slots
- **alternativeOptions**: Suggestions when no common slots exist

## Common Use Cases

### 1. Department Meeting
```javascript
// Find slots for all teachers in a department
const response = await fetch('/api/teachers/meeting-scheduler', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    teacherIds: departmentTeacherIds,
    minDuration: 2, // 2-hour meeting
    excludeDays: [6] // Exclude Saturday
  })
});
```

### 2. Project Planning Session
```javascript
// Find longer slots for project planning
const response = await fetch('/api/teachers/meeting-scheduler', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    teacherIds: projectTeamIds,
    minDuration: 3, // 3-hour session
    excludeDays: [0, 6] // Exclude Sunday and Saturday
  })
});
```

### 3. Quick Coordination Meeting
```javascript
// Find any available slot for quick meeting
const response = await fetch('/api/teachers/meeting-scheduler', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    teacherIds: [teacher1Id, teacher2Id],
    minDuration: 1 // Any single slot
  })
});
```

## Response Handling

### Success Case
```javascript
const data = await response.json();

if (data.success && data.data.commonFreeSlots.length > 0) {
  console.log(`Found ${data.data.commonFreeSlots.length} available meeting slots:`);
  
  data.data.commonFreeSlots.forEach(slot => {
    console.log(`- ${slot.dayName} ${slot.timeSlot.startTime}-${slot.timeSlot.endTime}`);
  });
} else {
  console.log('No common free slots found');
  
  // Check alternatives
  if (data.data.recommendations.alternativeOptions.length > 0) {
    console.log('Consider these alternatives:');
    data.data.recommendations.alternativeOptions.forEach(alt => {
      console.log(`- ${alt.suggestion}`);
    });
  }
}
```

### Error Handling
```javascript
try {
  const response = await fetch('/api/teachers/meeting-scheduler', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(requestData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to find meeting slots');
  }

  const data = await response.json();
  // Handle success
  
} catch (error) {
  console.error('Error finding meeting slots:', error.message);
  // Handle error appropriately
}
```

## Tips for Best Results

1. **Teacher Selection**: Start with 2-3 teachers for better availability
2. **Time Constraints**: Avoid excluding too many days
3. **Duration**: Use minDuration = 1 for maximum flexibility
4. **Peak Times**: Morning slots (10:15-11:55) often have better availability
5. **Academic Calendar**: Ensure you're searching in the current academic year

## Testing

Use the provided test script to verify the API:

```bash
cd /home/p0u/Documents/College/BE-routine
node test-meeting-scheduler.js
```

This script will:
1. Fetch available teachers from your database
2. Test the meeting scheduler with real data
3. Display the results in a readable format

## Integration with Frontend

The endpoint is designed to work with the provided React component (`TeacherMeetingScheduler.jsx`). To integrate:

1. Install the component in your React app
2. Configure the API base URL
3. Ensure authentication tokens are properly managed
4. Customize the UI to match your application's design

## Troubleshooting

### Common Issues

1. **"At least 2 teacher IDs are required"**
   - Ensure you're sending an array with minimum 2 teacher IDs

2. **"One or more teachers not found"**
   - Verify teacher IDs exist using `/api/teachers` endpoint

3. **"No academic year found"**
   - Set up an academic year with `isCurrentYear: true`

4. **Empty results**
   - Try reducing `minDuration`
   - Check if teachers actually have schedules in the system
   - Verify excludeDays settings

### Debug Steps
1. Test with known teacher IDs from `/api/teachers`
2. Start with minimal constraints (no excludeDays, minDuration=1)
3. Check server logs for detailed error information
4. Verify database connections and data integrity

For detailed API documentation, see `TEACHER_MEETING_SCHEDULER_API.md`.
