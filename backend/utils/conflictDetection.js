const RoutineSlot = require('../models/RoutineSlot');

// Helper function to determine if two semesters are in the same group
const areSemestersInSameGroup = (semester1, semester2) => {
  // Both odd (1, 3, 5, 7) or both even (2, 4, 6, 8)
  return (semester1 % 2) === (semester2 % 2);
};

// Helper function to get semester group name for logging
const getSemesterGroupName = (semester) => {
  return semester % 2 === 1 ? 'odd' : 'even';
};

/**
 * Check if teachers are available at a specific time slot
 * @param {Array} teacherIds - Array of teacher ObjectIds
 * @param {Number} dayIndex - Day index (0-5, Sunday-Friday)
 * @param {Number} slotIndex - Slot index
 * @param {Number} currentSemester - Current semester to check conflicts within same group
 * @param {String} excludeSlotId - Optional: Exclude specific routine slot from check (for updates)
 * @returns {Object} - { isAvailable: Boolean, conflicts: Array }
 */
async function checkTeacherAvailability(teacherIds, dayIndex, slotIndex, currentSemester = null, excludeSlotId = null) {
  try {
    const query = {
      dayIndex,
      slotIndex,
      teacherIds: { $in: teacherIds }
    };

    if (excludeSlotId) {
      query._id = { $ne: excludeSlotId };
    }

    const allConflicts = await RoutineSlot.find(query)
      .populate('subjectId', 'name code')
      .populate('teacherIds', 'fullName shortName')
      .populate('roomId', 'name');

    // Filter conflicts based on semester group if currentSemester is provided
    let conflicts = allConflicts;
    if (currentSemester !== null) {
      conflicts = allConflicts.filter(conflict => 
        areSemestersInSameGroup(parseInt(currentSemester), parseInt(conflict.semester))
      );
      
      console.log(`🔍 Teacher availability check: Found ${allConflicts.length} total conflicts, ${conflicts.length} in same semester group (${getSemesterGroupName(currentSemester)})`);
    }

    return {
      isAvailable: conflicts.length === 0,
      conflicts: conflicts.map(conflict => ({
        slotId: conflict._id,
        programCode: conflict.programCode,
        semester: conflict.semester,
        section: conflict.section,
        subjectName: conflict.subjectName || conflict.subjectId?.name,
        conflictingTeachers: conflict.teacherIds.filter(t => 
          teacherIds.some(tid => tid.toString() === t._id.toString())
        ),
        roomName: conflict.roomName_display || conflict.roomId?.name,
        classType: conflict.classType,
        semesterGroup: getSemesterGroupName(conflict.semester)
      }))
    };
  } catch (error) {
    console.error('Error checking teacher availability:', error);
    throw error;
  }
}

/**
 * Check if a room is available at a specific time slot
 * @param {String} roomId - Room ObjectId
 * @param {Number} dayIndex - Day index (0-5, Sunday-Friday)
 * @param {Number} slotIndex - Slot index
 * @param {Number} currentSemester - Current semester to check conflicts within same group
 * @param {String} excludeSlotId - Optional: Exclude specific routine slot from check (for updates)
 * @returns {Object} - { isAvailable: Boolean, conflict: Object|null }
 */
async function checkRoomAvailability(roomId, dayIndex, slotIndex, currentSemester = null, excludeSlotId = null) {
  try {
    const query = {
      dayIndex,
      slotIndex,
      roomId
    };

    if (excludeSlotId) {
      query._id = { $ne: excludeSlotId };
    }

    const allConflicts = await RoutineSlot.find(query)
      .populate('subjectId', 'name code')
      .populate('teacherIds', 'fullName shortName')
      .populate('roomId', 'name');

    // Filter conflicts based on semester group if currentSemester is provided
    let conflict = null;
    if (currentSemester !== null) {
      const sameGroupConflicts = allConflicts.filter(c => 
        areSemestersInSameGroup(parseInt(currentSemester), parseInt(c.semester))
      );
      conflict = sameGroupConflicts.length > 0 ? sameGroupConflicts[0] : null;
      
      console.log(`🔍 Room availability check: Found ${allConflicts.length} total conflicts, ${sameGroupConflicts.length} in same semester group (${getSemesterGroupName(currentSemester)})`);
    } else {
      conflict = allConflicts.length > 0 ? allConflicts[0] : null;
    }

    return {
      isAvailable: !conflict,
      conflict: conflict ? {
        slotId: conflict._id,
        programCode: conflict.programCode,
        semester: conflict.semester,
        section: conflict.section,
        subjectName: conflict.subjectName || conflict.subjectId?.name,
        teacherNames: conflict.teacherIds.map(t => t.fullName),
        roomName: conflict.roomName_display || conflict.roomId?.name,
        classType: conflict.classType,
        semesterGroup: getSemesterGroupName(conflict.semester)
      } : null
    };
  } catch (error) {
    console.error('Error checking room availability:', error);
    throw error;
  }
}

/**
 * Check for any conflicts when assigning a class to a routine slot
 * @param {Object} slotData - Slot assignment data
 * @param {String} excludeSlotId - Optional: Exclude specific routine slot from check
 * @returns {Object} - { hasConflicts: Boolean, teacherConflicts: Array, roomConflict: Object|null }
 */
async function checkScheduleConflicts(slotData, excludeSlotId = null) {
  const { teacherIds, roomId, dayIndex, slotIndex, semester } = slotData;

  try {
    // Check teacher conflicts - pass semester for semester group checking
    const teacherCheck = await checkTeacherAvailability(teacherIds, dayIndex, slotIndex, semester, excludeSlotId);
    
    // Check room conflicts - pass semester for semester group checking
    const roomCheck = await checkRoomAvailability(roomId, dayIndex, slotIndex, semester, excludeSlotId);

    return {
      hasConflicts: !teacherCheck.isAvailable || !roomCheck.isAvailable,
      teacherConflicts: teacherCheck.conflicts,
      roomConflict: roomCheck.conflict
    };
  } catch (error) {
    console.error('Error checking schedule conflicts:', error);
    throw error;
  }
}

/**
 * Get all conflicts for a specific teacher across their schedule
 * @param {String} teacherId - Teacher ObjectId
 * @param {Number} semesterFilter - Optional: Filter conflicts to specific semester group (odd/even)
 * @returns {Array} - Array of time slots where teacher is scheduled
 */
async function getTeacherScheduleConflicts(teacherId, semesterFilter = null) {
  try {
    const slots = await RoutineSlot.find({
      teacherIds: teacherId
    })
      .populate('subjectId', 'name code')
      .populate('roomId', 'name')
      .sort({ dayIndex: 1, slotIndex: 1 });

    // Group by time slots to identify overlaps
    const timeSlotMap = new Map();
    
    slots.forEach(slot => {
      const key = `${slot.dayIndex}-${slot.slotIndex}`;
      if (!timeSlotMap.has(key)) {
        timeSlotMap.set(key, []);
      }
      timeSlotMap.get(key).push(slot);
    });

    // Find conflicts (time slots with multiple entries)
    const conflicts = [];
    timeSlotMap.forEach((slotList, timeKey) => {
      if (slotList.length > 1) {
        // Filter by semester group if specified
        let filteredSlots = slotList;
        if (semesterFilter !== null) {
          filteredSlots = slotList.filter(slot => 
            areSemestersInSameGroup(parseInt(semesterFilter), parseInt(slot.semester))
          );
        }
        
        if (filteredSlots.length > 1) {
          conflicts.push({
            dayIndex: filteredSlots[0].dayIndex,
            slotIndex: filteredSlots[0].slotIndex,
            semesterGroup: semesterFilter !== null ? getSemesterGroupName(semesterFilter) : 'all',
            conflictingSlots: filteredSlots.map(slot => ({
              slotId: slot._id,
              programCode: slot.programCode,
              semester: slot.semester,
              section: slot.section,
              subjectName: slot.subjectName || slot.subjectId?.name,
              roomName: slot.roomName_display || slot.roomId?.name,
              classType: slot.classType,
              semesterGroup: getSemesterGroupName(slot.semester)
            }))
          });
        }
      }
    });

    return conflicts;
  } catch (error) {
    console.error('Error getting teacher schedule conflicts:', error);
    throw error;
  }
}

/**
 * Get available teachers for a specific time slot
 * @param {Number} dayIndex - Day index (0-5)
 * @param {Number} slotIndex - Slot index
 * @param {Number} currentSemester - Current semester to check conflicts within same group
 * @param {Array} excludeTeacherIds - Optional: Teacher IDs to exclude from results
 * @returns {Array} - Array of available teacher IDs
 */
async function getAvailableTeachers(dayIndex, slotIndex, currentSemester = null, excludeTeacherIds = []) {
  try {
    const Teacher = require('../models/Teacher');
    
    // Get all teachers
    const allTeachers = await Teacher.find({}, '_id');
    
    // Get busy teachers at this time slot
    const busySlots = await RoutineSlot.find({
      dayIndex,
      slotIndex
    }, 'teacherIds semester');

    const busyTeacherIds = new Set();
    busySlots.forEach(slot => {
      // Only consider busy if in same semester group (or no semester filter)
      if (currentSemester === null || areSemestersInSameGroup(parseInt(currentSemester), parseInt(slot.semester))) {
        slot.teacherIds.forEach(teacherId => {
          busyTeacherIds.add(teacherId.toString());
        });
      }
    });

    // Filter available teachers
    const availableTeachers = allTeachers.filter(teacher => {
      const teacherId = teacher._id.toString();
      return !busyTeacherIds.has(teacherId) && 
             !excludeTeacherIds.some(excludeId => excludeId.toString() === teacherId);
    });

    return availableTeachers.map(teacher => teacher._id);
  } catch (error) {
    console.error('Error getting available teachers:', error);
    throw error;
  }
}

/**
 * Get available rooms for a specific time slot
 * @param {Number} dayIndex - Day index (0-5)
 * @param {Number} slotIndex - Slot index
 * @param {Number} currentSemester - Current semester to check conflicts within same group
 * @param {Array} excludeRoomIds - Optional: Room IDs to exclude from results
 * @returns {Array} - Array of available room IDs
 */
async function getAvailableRooms(dayIndex, slotIndex, currentSemester = null, excludeRoomIds = []) {
  try {
    const Room = require('../models/Room');
    
    // Get all rooms
    const allRooms = await Room.find({}, '_id');
    
    // Get busy rooms at this time slot
    const busySlots = await RoutineSlot.find({
      dayIndex,
      slotIndex
    }, 'roomId semester');

    const busyRoomIds = new Set();
    busySlots.forEach(slot => {
      if (slot.roomId) {
        // Only consider busy if in same semester group (or no semester filter)
        if (currentSemester === null || areSemestersInSameGroup(parseInt(currentSemester), parseInt(slot.semester))) {
          busyRoomIds.add(slot.roomId.toString());
        }
      }
    });

    // Filter available rooms
    const availableRooms = allRooms.filter(room => {
      const roomId = room._id.toString();
      return !busyRoomIds.has(roomId) && 
             !excludeRoomIds.some(excludeId => excludeId.toString() === roomId);
    });

    return availableRooms.map(room => room._id);
  } catch (error) {
    console.error('Error getting available rooms:', error);
    throw error;
  }
}

module.exports = {
  checkTeacherAvailability,
  checkRoomAvailability,
  checkScheduleConflicts,
  getTeacherScheduleConflicts,
  getAvailableTeachers,
  getAvailableRooms
};
