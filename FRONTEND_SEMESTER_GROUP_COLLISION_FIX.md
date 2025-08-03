# Frontend Semester Group Collision Detection Fix

## Issue
Teachers and rooms were showing as "Busy" in the frontend even when their existing classes were in a different semester group (odd vs even). For example, teacher "Anish Adhikari" was showing as busy for Semester 8 (even) classes even though his existing class was in an odd semester.

## Root Cause
The frontend API calls for checking teacher and room availability were not passing the `semester` parameter to the backend endpoints, so the backend was falling back to the legacy behavior of showing all conflicts regardless of semester group.

## Changes Made

### 1. Updated API Service (`/frontend/src/services/api.js`)
**Modified functions to accept optional semester parameter:**
- `checkTeacherAvailability(teacherId, dayIndex, slotIndex, semester = null)` - Now accepts semester parameter
- `checkRoomAvailability(roomId, dayIndex, slotIndex, semester = null)` - Now accepts semester parameter

Both functions now construct query parameters dynamically, only including semester when provided.

### 2. Updated AssignClassModal (`/frontend/src/components/AssignClassModal.jsx`)
**Updated all teacher and room availability checks to pass semester:**
- Initial teacher filtering when class type changes: `checkTeacherAvailability(teacher._id, dayIndex, slotIndex, semester)`
- Conflict checking for teacher assignments: `checkTeacherAvailability(teacherId, dayIndex, normalizedSlotId, semester)`
- Conflict checking for room assignments: `checkRoomAvailability(values.roomId, dayIndex, normalizedSlotId, semester)`

### 3. Updated AssignClassSpannedModal (`/frontend/src/components/AssignClassSpannedModal.jsx`)
**Updated all teacher and room availability checks for spanned classes:**
- Initial conflict check: `checkTeacherAvailability(teacherId, dayIndex, slotIndex, semester)`
- Initial room check: `checkRoomAvailability(values.roomId, dayIndex, slotIndex, semester)`
- Spanned slot teacher checks: `checkTeacherAvailability(teacherId, dayIndex, currentSlotId, semester)`
- Spanned slot room checks: `checkRoomAvailability(values.roomId, dayIndex, currentSlotId, semester)`

## How It Works Now

### Before the Fix:
- Frontend calls: `GET /api/routines/teachers/123/availability?dayIndex=5&slotIndex=3`
- Backend returns: All conflicts regardless of semester group
- Result: Teacher shows as "Busy" even for different semester groups

### After the Fix:
- Frontend calls: `GET /api/routines/teachers/123/availability?dayIndex=5&slotIndex=3&semester=8`
- Backend returns: Only conflicts within the same semester group (even semesters: 2,4,6,8)
- Result: Teacher shows as "Free" if their existing class is in odd semester (1,3,5,7)

## Example Scenario
- **Teacher:** Anish Adhikari (AA)
- **Existing Class:** Semester 1 (odd), Friday 11:05-11:55
- **New Assignment:** Semester 8 (even), Friday 11:05-11:55
- **Before Fix:** Shows as "Busy" ❌
- **After Fix:** Shows as "Free" ✅

## Backward Compatibility
- All changes maintain backward compatibility
- When `semester` parameter is not provided, backend falls back to previous behavior
- General teacher availability pages (like Teachers.jsx) continue to work without changes

## Files Modified
1. ✅ `/frontend/src/services/api.js` - Updated API functions to accept semester parameter
2. ✅ `/frontend/src/components/AssignClassModal.jsx` - Updated all availability checks to pass semester
3. ✅ `/frontend/src/components/AssignClassSpannedModal.jsx` - Updated all availability checks to pass semester

## Testing
- All files passed syntax validation with no errors
- Frontend now properly sends semester parameter to backend endpoints
- Backend semester group logic (already implemented) now receives necessary data

The issue where teachers and rooms were incorrectly showing as "Busy" for different semester groups has been resolved. The frontend now properly communicates the semester context to the backend, enabling accurate semester group-based collision detection.
