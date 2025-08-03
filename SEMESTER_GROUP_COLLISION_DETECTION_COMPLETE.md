# Semester Group-Based Collision Detection Implementation

## Summary
Updated the collision detection system so that teacher and room conflicts are only detected if they occur within the same semester group (odd/even). Classes in different semester groups (e.g., odd semesters 1,3,5,7 vs even semesters 2,4,6,8) can now be scheduled at the same time without conflicts.

## Changes Made

### 1. Updated `/backend/utils/conflictDetection.js`
**Added helper functions:**
- `areSemestersInSameGroup(semester1, semester2)` - Determines if two semesters are in the same group
- `getSemesterGroupName(semester)` - Returns 'odd' or 'even' for logging

**Updated functions to include semester group logic:**
- `checkTeacherAvailability()` - Now accepts `currentSemester` parameter and filters conflicts by semester group
- `checkRoomAvailability()` - Now accepts `currentSemester` parameter and filters conflicts by semester group
- `checkScheduleConflicts()` - Now extracts `semester` from `slotData` and passes it to availability checks
- `getTeacherScheduleConflicts()` - Added `semesterFilter` parameter for semester group filtering
- `getAvailableTeachers()` - Now considers semester groups when determining teacher availability
- `getAvailableRooms()` - Now considers semester groups when determining room availability

### 2. Updated `/backend/services/conflictDetection.js`
**Already had semester group logic in:**
- `ConflictDetectionService.checkTeacherConflicts()` - Already implemented with semester group filtering
- `ConflictDetectionService.checkRoomConflicts()` - Already implemented with semester group filtering

**Added missing method:**
- `ConflictDetectionService.checkSlotConflicts()` - Added wrapper method that uses the updated utility functions with semester group logic

### 3. Updated `/backend/controllers/routineController.js`
**Already had semester group logic in:**
- `checkAdvancedConflicts()` - Already implemented with `areSemestersInSameGroup()` checks
- Helper functions `areSemestersInSameGroup()` and `getSemesterGroupName()` already existed

**Updated API endpoint functions:**
- `checkTeacherAvailability()` - Modified to accept optional `semester` query parameter and filter conflicts by semester group
- `checkRoomAvailability()` - Modified to accept optional `semester` query parameter and filter conflicts by semester group

## Implementation Details

### Semester Group Logic
- **Odd semesters:** 1, 3, 5, 7
- **Even semesters:** 2, 4, 6, 8
- **Logic:** `(semester1 % 2) === (semester2 % 2)`

### Conflict Detection Flow
1. When checking for teacher/room conflicts, the system now:
   - Finds all potential conflicting slots at the same time
   - Filters conflicts to only include those in the same semester group
   - Only reports conflicts if both classes are in the same group (odd/even)

2. Classes in different semester groups can be scheduled simultaneously:
   - ✅ Semester 1 (odd) and Semester 2 (even) at same time = NO CONFLICT
   - ✅ Semester 3 (odd) and Semester 4 (even) at same time = NO CONFLICT
   - ❌ Semester 1 (odd) and Semester 3 (odd) at same time = CONFLICT
   - ❌ Semester 2 (even) and Semester 4 (even) at same time = CONFLICT

### API Changes
Teacher and room availability endpoints now accept an optional `semester` parameter:
- `GET /api/routines/teachers/:teacherId/availability?dayIndex=0&slotIndex=1&semester=3`
- `GET /api/routines/rooms/:roomId/availability?dayIndex=0&slotIndex=1&semester=4`

When `semester` is provided, conflicts are only reported for classes in the same semester group.

## Backward Compatibility
- All changes maintain backward compatibility
- When `semester` parameter is not provided, the system falls back to previous behavior
- Existing API calls continue to work as before

## Files Modified
1. `/backend/utils/conflictDetection.js` - ✅ Updated utility functions
2. `/backend/services/conflictDetection.js` - ✅ Added missing method, existing logic already correct
3. `/backend/controllers/routineController.js` - ✅ Updated API endpoints, existing core logic already correct

## Verification
- All files passed syntax checks with no errors
- Semester group helper functions are properly exported and imported
- API endpoints updated to handle semester parameter
- Conflict detection methods now filter by semester groups
- Logging added for debugging semester group conflicts

The collision detection system now properly implements semester group-based filtering, allowing efficient scheduling of classes from different semester groups at the same time while maintaining strict conflict detection within the same semester group.
