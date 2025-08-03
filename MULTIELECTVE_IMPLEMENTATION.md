# Multiple Elective Classes Implementation

## Overview
Enhanced the routine system to support multiple elective subjects in a single time slot, with synchronized subject-teacher pairing as shown in the green routine example.

## Backend Changes

### 1. Database Model Updates (`RoutineSlot.js`)

#### New Fields Added:
```javascript
// Multiple subjects support for elective classes
subjectIds: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Subject'
}]
```

#### Validation Added:
- Ensures subject count matches teacher count for elective classes
- Prevents duplicate subjects in the same elective slot
- Maintains subject-teacher order synchronization

### 2. New API Endpoint

#### POST `/api/routine-slots/elective`
Creates elective classes with multiple subjects and synchronized teachers.

**Request Body:**
```javascript
{
  "programId": "507f1f77bcf86cd799439011",
  "semester": 7,
  "section": "AB",
  "dayIndex": 1,
  "slotIndex": 3,
  "academicYearId": "507f1f77bcf86cd799439012",
  "roomId": "507f1f77bcf86cd799439013",
  "subjects": [
    {
      "subjectId": "507f1f77bcf86cd799439014",
      "teacherId": "507f1f77bcf86cd799439015"
    },
    {
      "subjectId": "507f1f77bcf86cd799439016", 
      "teacherId": "507f1f77bcf86cd799439017"
    },
    {
      "subjectId": "507f1f77bcf86cd799439018",
      "teacherId": "507f1f77bcf86cd799439019"
    }
  ],
  "electiveInfo": {
    "electiveNumber": 1,
    "electiveType": "TECHNICAL",
    "groupName": "7th Sem Technical Elective"
  },
  "targetSections": ["AB", "CD"],
  "displayInSections": ["AB", "CD"]
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "subjectIds": ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439016", "507f1f77bcf86cd799439018"],
    "teacherIds": ["507f1f77bcf86cd799439015", "507f1f77bcf86cd799439017", "507f1f77bcf86cd799439019"],
    "isElectiveClass": true,
    "electiveInfo": {
      "electiveNumber": 1,
      "electiveType": "TECHNICAL",
      "groupName": "7th Sem Technical Elective"
    },
    // ... other fields
  },
  "message": "Elective class created with 3 subjects"
}
```

### 3. Enhanced Routine Display

#### New Response Fields:
```javascript
{
  // Multiple subjects for electives
  "subjects": [
    {
      "id": "507f1f77bcf86cd799439014",
      "code": "IOTBI302",
      "name": "Internet of Things for Business Intelligence"
    },
    {
      "id": "507f1f77bcf86cd799439016", 
      "code": "ADMSCI",
      "name": "Advanced Management Science"
    },
    {
      "id": "507f1f77bcf86cd799439018",
      "code": "EC303", 
      "name": "Electronic Commerce"
    }
  ],
  
  // Synchronized subject-teacher pairs
  "subjectTeacherPairs": [
    {
      "subject": {
        "id": "507f1f77bcf86cd799439014",
        "code": "IOTBI302",
        "name": "Internet of Things for Business Intelligence"
      },
      "teacher": {
        "id": "507f1f77bcf86cd799439015",
        "shortName": "JS",
        "fullName": "John Smith"
      }
    },
    {
      "subject": {
        "id": "507f1f77bcf86cd799439016",
        "code": "ADMSCI", 
        "name": "Advanced Management Science"
      },
      "teacher": {
        "id": "507f1f77bcf86cd799439017",
        "shortName": "MD",
        "fullName": "Mary Davis"
      }
    },
    {
      "subject": {
        "id": "507f1f77bcf86cd799439018",
        "code": "EC303",
        "name": "Electronic Commerce"
      },
      "teacher": {
        "id": "507f1f77bcf86cd799439019",
        "shortName": "PK",
        "fullName": "Peter Kumar"
      }
    }
  ],
  
  // Enhanced flags
  "isMultipleElectives": true,
  "electiveCount": 3
}
```

## Frontend Display Format

### Multiple Electives Cell Structure:
```
┌─────────────────────────────────┐
│         Elective 1              │
│                                 │
│ IOTBI302 - JS                   │
│ ADMSCI   - MD                   │  
│ EC303    - PK                   │
│                                 │
│ Cross-Section: AB, CD           │
└─────────────────────────────────┘
```

### Key Display Features:
1. **Subject-Teacher Synchronization**: Each subject displays with its corresponding teacher
2. **Order Preservation**: Subject order matches teacher order as defined in creation
3. **Cross-Section Indicators**: Shows which sections participate
4. **Elective Numbering**: Distinguishes between different elective groups

## Usage Examples

### 1. Creating 7th Semester Technical Electives
```javascript
const electiveData = {
  programId: "bct_program_id",
  semester: 7,
  section: "AB",
  dayIndex: 1, // Monday
  slotIndex: 3, // Period 4
  subjects: [
    { subjectId: "iotbi302_id", teacherId: "teacher1_id" },
    { subjectId: "admsci_id", teacherId: "teacher2_id" },
    { subjectId: "ec303_id", teacherId: "teacher3_id" },
    { subjectId: "adsci301_id", teacherId: "teacher4_id" }
  ],
  electiveInfo: {
    electiveNumber: 1,
    electiveType: "TECHNICAL",
    groupName: "7th Sem Technical Elective - Group 1"
  },
  targetSections: ["AB", "CD"],
  displayInSections: ["AB", "CD"]
};

// API call
const response = await fetch('/api/routine-slots/elective', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(electiveData)
});
```

### 2. Creating 8th Semester Management Electives
```javascript
const mgmtElectiveData = {
  programId: "bct_program_id",
  semester: 8,
  section: "AB", 
  dayIndex: 2, // Tuesday
  slotIndex: 1, // Period 2
  subjects: [
    { subjectId: "hrm_id", teacherId: "teacher5_id" },
    { subjectId: "marketing_id", teacherId: "teacher6_id" },
    { subjectId: "finance_id", teacherId: "teacher7_id" }
  ],
  electiveInfo: {
    electiveNumber: 2,
    electiveType: "MANAGEMENT", 
    groupName: "8th Sem Management Elective - Group 2"
  }
};
```

## Benefits

### 1. **Accurate Representation**
- Matches the actual academic structure where multiple electives run simultaneously
- Maintains proper subject-teacher relationships

### 2. **Improved Scheduling**
- Prevents double-booking of teachers across multiple electives
- Ensures room capacity considerations for cross-section classes

### 3. **Better User Experience**
- Clear visual representation of elective options
- Easy identification of teacher assignments for each subject

### 4. **Administrative Efficiency**
- Single API call creates complete elective setup
- Automatic validation prevents configuration errors
- Synchronized data ensures consistency

## Backward Compatibility

- Existing single-subject electives continue to work unchanged
- New `subjectIds` field is optional and only used for multi-subject electives
- Legacy `subjectId` field maintained for compatibility
- All existing API endpoints remain functional

## Migration Guide

### From Single to Multiple Electives:
1. Identify existing elective slots that should have multiple subjects
2. Use the new `/api/routine-slots/elective` endpoint
3. Provide subject-teacher pairs in the desired display order
4. Set appropriate elective metadata (number, type, group name)

### Frontend Integration:
1. Check for `isMultipleElectives` flag in slot data
2. Use `subjectTeacherPairs` array for synchronized display
3. Show `electiveCount` and elective group information
4. Handle cross-section display appropriately

This implementation provides a complete solution for managing multiple elective subjects with proper teacher assignment synchronization, matching the academic requirements shown in the green routine example.
