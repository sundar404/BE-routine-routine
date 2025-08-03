# Semester Grouping System

This document explains the semester grouping system that allows filtering of teacher and room routines based on odd/even semester groups.

## Overview

The semester grouping system provides a toggle interface that allows users to filter routine displays to show only:
- **All Semesters**: Shows classes from all semesters (default)
- **Odd Semesters**: Shows classes from semesters 1, 3, 5, 7
- **Even Semesters**: Shows classes from semesters 2, 4, 6, 8

## Components

### 1. SemesterGroupContext
**File:** `frontend/src/contexts/SemesterGroupContext.jsx`

Provides React context for managing semester group state across components.

**Exports:**
- `SemesterGroupProvider` - Context provider component
- `useSemesterGroup` - Hook to consume the context
- `filterRoutineBySemesterGroup` - Helper function to filter routine data
- `isSemesterInGroup` - Helper function to check if a semester belongs to a group
- `getSemesterGroupLabel` - Helper function to get user-friendly labels

### 2. SemesterGroupToggle
**File:** `frontend/src/components/SemesterGroupToggle.jsx`

Reusable UI component for the semester group toggle.

**Props:**
- `size` - Size of the toggle buttons ('small', 'default', 'large')
- `showLabel` - Whether to show the "Semester Group:" label
- `showDescription` - Whether to show the description text
- `style` - Custom styles
- `cardStyle` - Whether to wrap in a card
- `orientation` - Layout orientation ('horizontal' or 'vertical')

### 3. useFilteredRoutine Hook
**File:** `frontend/src/hooks/useFilteredRoutine.js`

Custom hook that provides filtered routine data based on the current semester group selection.

**Parameters:**
- `routineData` - Original routine data to filter
- `options` - Configuration object
  - `enabled` - Whether filtering is enabled
  - `forTeacherView` - Special handling for teacher views
  - `forRoomView` - Special handling for room views

**Returns:**
- `filteredRoutine` - Filtered routine data
- `stats` - Statistics for the filtered data
- `semesterGroup` - Current semester group selection
- `isFiltered` - Whether filtering is currently applied

## Usage

### Adding to a New Component

1. **Wrap your component with the provider:**
```jsx
import { SemesterGroupProvider } from '../contexts/SemesterGroupContext';

const MyComponent = () => {
  return (
    <SemesterGroupProvider>
      <MyComponentContent />
    </SemesterGroupProvider>
  );
};
```

2. **Use the filtering hook in your component:**
```jsx
import { useFilteredRoutine } from '../hooks/useFilteredRoutine';

const MyComponentContent = () => {
  const { filteredRoutine, stats, isFiltered } = useFilteredRoutine(
    routineData, 
    { 
      enabled: true,
      forTeacherView: true 
    }
  );

  // Use filteredRoutine instead of routineData for display
  return <RoutineGrid routineData={filteredRoutine} />;
};
```

3. **Add the toggle UI:**
```jsx
import SemesterGroupToggle from '../components/SemesterGroupToggle';

// In your render:
<SemesterGroupToggle 
  size="default"
  showLabel={true}
  showDescription={true}
/>

{isFiltered && (
  <Text type="secondary">
    Filtered: {stats.filteredFromTotal} classes hidden
  </Text>
)}
```

## Implementation Status

✅ **Implemented in:**
- ProgramRoutineView (Teacher mode only)
- TeacherScheduleManager  
- RoomScheduleManager

❌ **Not yet implemented in:**
- Program routine view (non-teacher mode)
- Admin routine manager
- Other routine-related components

## Data Flow

1. User selects a semester group using the toggle
2. Context updates the global semester group state
3. `useFilteredRoutine` hook filters the routine data based on the selection
4. Components receive filtered data and display only relevant classes
5. Statistics are recalculated for the filtered data

## Filtering Logic

The filtering is based on the `semester` field in class data:
- **Odd group**: `semester % 2 === 1` (1, 3, 5, 7)
- **Even group**: `semester % 2 === 0` (2, 4, 6, 8)  
- **All group**: No filtering applied

## Future Enhancements

1. **Backend filtering**: Move filtering to API endpoints for better performance
2. **Additional grouping options**: By year, by program, etc.
3. **Persistent selection**: Remember user's preference across sessions
4. **Program-specific filtering**: Different filters for different programs
5. **Advanced filters**: Combine multiple criteria

## Technical Notes

- The system uses React Context to avoid prop drilling
- Filtering is done client-side for now
- Statistics are recalculated for filtered data
- The system is designed to be easily extensible for other filtering criteria
- All components maintain backward compatibility when context is not provided
