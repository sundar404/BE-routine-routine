const { createPDFGenerator } = require('../utils/pdfGeneration');
const Teacher = require('../models/Teacher');
const Room = require('../models/Room');
const RoutineSlot = require('../models/RoutineSlot');

// Helper function to get teacher schedule data
const getTeacherScheduleData = async (teacherId, academicYearId) => {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    throw new Error('Teacher not found');
  }

  // Get current academic year if not specified
  let academicYear;
  if (academicYearId) {
    const AcademicCalendar = require('../models/AcademicCalendar');
    academicYear = await AcademicCalendar.findById(academicYearId);
  } else {
    const AcademicCalendar = require('../models/AcademicCalendar');
    academicYear = await AcademicCalendar.findOne({ isCurrentYear: true });
  }

  // If no academic year found, return empty schedule
  if (!academicYear) {
    return {
      teacherId: teacher._id,
      fullName: teacher.fullName,
      shortName: teacher.shortName,
      programCode: 'TEACHER_VIEW',
      semester: 'ALL',
      section: 'ALL',
      routine: {
        0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}
      },
      message: 'No current academic year set. Please set an academic year to view schedules.'
    };
  }

  // Get all routine slots for this teacher (matching teacherController logic)
  const routineSlots = await RoutineSlot.find({
    teacherIds: teacher._id,
    isActive: true
  }).populate([
    { path: 'programId', select: 'code name' },
    { path: 'subjectId', select: 'code name weeklyHours' },
    { path: 'roomId', select: 'name building' },
    { path: 'labGroupId', select: 'groups' }
  ]).sort({ dayIndex: 1, slotIndex: 1 });

  // Create routine object with day indices as keys and slot indices as sub-keys
  const routine = {};
  
  // Initialize routine object for all days (0-6 = Sunday to Saturday)
  for (let day = 0; day <= 6; day++) {
    routine[day] = {};
  }

  // Populate routine with classes using the EXACT SAME structure as class routine
  routineSlots.forEach(slot => {
    const slotData = {
      _id: slot._id,
      subjectId: slot.subjectId?._id,
      subjectName: slot.subjectName_display || slot.subjectId?.name || 'Unknown Subject',
      subjectCode: slot.subjectCode_display || slot.subjectId?.code || 'N/A',
      teacherIds: slot.teacherIds,
      teacherNames: slot.teacherNames_display || slot.teacherIds?.map(t => t.fullName) || [teacher.fullName],
      teacherShortNames: slot.teacherShortNames_display || slot.teacherIds?.map(t => t.shortName) || [teacher.shortName],
      roomId: slot.roomId?._id,
      roomName: slot.roomName_display || slot.roomId?.name || 'TBA',
      classType: slot.classType,
      notes: slot.notes,
      timeSlot_display: slot.timeSlot_display || '',
      spanId: slot.spanId,
      spanMaster: slot.spanMaster,
      programCode: slot.programCode,
      semester: slot.semester,
      section: slot.section,
      programSemesterSection: `${slot.programCode} Sem${slot.semester} ${slot.section}`,
      labGroupName: slot.labGroupName,
      recurrence: slot.recurrence,
      isElectiveClass: slot.isElectiveClass || false,
      classCategory: slot.classCategory || 'CORE',
      electiveInfo: slot.electiveInfo || null,
      labGroup: slot.labGroup,
      isAlternativeWeek: slot.isAlternativeWeek,
      alternateGroupData: slot.alternateGroupData
    };
    
    // Handle multiple slots in the same time slot
    if (routine[slot.dayIndex][slot.slotIndex]) {
      const existing = routine[slot.dayIndex][slot.slotIndex];
      if (Array.isArray(existing)) {
        existing.push(slotData);
      } else {
        routine[slot.dayIndex][slot.slotIndex] = [existing, slotData];
      }
    } else {
      routine[slot.dayIndex][slot.slotIndex] = slotData;
    }
  });

  return {
    teacherId: teacher._id,
    fullName: teacher.fullName,
    shortName: teacher.shortName,
    programCode: 'TEACHER_VIEW',
    semester: 'ALL',
    section: 'ALL',
    routine
  };
};

// Helper function to get room schedule data
const getRoomScheduleData = async (roomId, academicYearId) => {
  const room = await Room.findById(roomId);
  if (!room) {
    throw new Error('Room not found');
  }

  // Get current academic year if not specified
  let academicYear;
  if (academicYearId) {
    const AcademicCalendar = require('../models/AcademicCalendar');
    academicYear = await AcademicCalendar.findById(academicYearId);
  } else {
    const AcademicCalendar = require('../models/AcademicCalendar');
    academicYear = await AcademicCalendar.findOne({ isCurrentYear: true });
  }

  // If no academic year found, return empty schedule
  if (!academicYear) {
    return {
      roomId: room._id,
      roomName: room.name,
      building: room.building,
      programCode: 'ROOM_VIEW',
      semester: 'ALL',
      section: 'ALL',
      routine: {
        0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}
      },
      message: 'No current academic year set. Please set an academic year to view schedules.'
    };
  }

  // Get all routine slots for this room
  const routineSlots = await RoutineSlot.find({
    roomId: room._id,
    isActive: true
  }).populate([
    { path: 'programId', select: 'code name' },
    { path: 'subjectId', select: 'code name weeklyHours' },
    { path: 'teacherIds', select: 'fullName shortName' },
    { path: 'labGroupId', select: 'groups' }
  ]).sort({ dayIndex: 1, slotIndex: 1 });

  // Create routine object with day indices as keys and slot indices as sub-keys
  const routine = {};
  
  // Initialize routine object for all days (0-6 = Sunday to Saturday)
  for (let day = 0; day <= 6; day++) {
    routine[day] = {};
  }

  // Populate routine with classes
  routineSlots.forEach(slot => {
    const slotData = {
      _id: slot._id,
      subjectId: slot.subjectId?._id,
      subjectName: slot.subjectName_display || slot.subjectId?.name || 'Unknown Subject',
      subjectCode: slot.subjectCode_display || slot.subjectId?.code || 'N/A',
      teacherIds: slot.teacherIds,
      teacherNames: slot.teacherNames_display || slot.teacherIds?.map(t => t.fullName) || [],
      teacherShortNames: slot.teacherShortNames_display || slot.teacherIds?.map(t => t.shortName) || [],
      roomId: slot.roomId?._id,
      roomName: slot.roomName_display || slot.roomId?.name || room.name,
      classType: slot.classType,
      notes: slot.notes,
      timeSlot_display: slot.timeSlot_display || '',
      spanId: slot.spanId,
      spanMaster: slot.spanMaster,
      programCode: slot.programCode,
      semester: slot.semester,
      section: slot.section,
      programSemesterSection: `${slot.programCode} Sem${slot.semester} ${slot.section}`,
      labGroupName: slot.labGroupName,
      recurrence: slot.recurrence,
      isElectiveClass: slot.isElectiveClass || false,
      classCategory: slot.classCategory || 'CORE',
      electiveInfo: slot.electiveInfo || null,
      labGroup: slot.labGroup,
      isAlternativeWeek: slot.isAlternativeWeek,
      alternateGroupData: slot.alternateGroupData
    };
    
    // Handle multiple slots in the same time slot
    if (routine[slot.dayIndex][slot.slotIndex]) {
      const existing = routine[slot.dayIndex][slot.slotIndex];
      if (Array.isArray(existing)) {
        existing.push(slotData);
      } else {
        routine[slot.dayIndex][slot.slotIndex] = [existing, slotData];
      }
    } else {
      routine[slot.dayIndex][slot.slotIndex] = slotData;
    }
  });

  return {
    roomId: room._id,
    roomName: room.name,
    building: room.building,
    programCode: 'ROOM_VIEW',
    semester: 'ALL',
    section: 'ALL',
    routine
  };
};

/**
 * @swagger
 * components:
 *   schemas:
 *     PDFExportResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         filename:
 *           type: string
 */

/**
 * @swagger
 * /api/pdf/routine/export:
 *   get:
 *     summary: Export class routine to PDF
 *     tags: [PDF Export]
 *     parameters:
 *       - in: query
 *         name: programCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Program code (e.g., BCT, BCE)
 *       - in: query
 *         name: semester
 *         required: true
 *         schema:
 *           type: integer
 *         description: Semester number
 *       - in: query
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *         description: Section (e.g., AB, CD)
 *     responses:
 *       200:
 *         description: PDF file generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
const exportRoutineToPDF = async (req, res) => {
  try {
    const { programCode, semester, section } = req.query;

    // Validate required parameters
    if (!programCode || !semester || !section) {
      return res.status(400).json({
        success: false,
        message: 'Program code, semester, and section are required'
      });
    }

    console.log(`📄 Generating PDF for: ${programCode} Sem ${semester} Section ${section}`);

    // Create PDF generator and generate routine PDF
    const routineGenerator = createPDFGenerator('routine');
    const pdfBuffer = await routineGenerator.generateClassRoutinePDF(programCode, semester, section);

    // Set response headers for PDF download
    const fileName = `${programCode.toUpperCase()}_Sem${semester}_${section.toUpperCase()}_Routine_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);

    console.log(`✅ PDF generated successfully: ${fileName}`);

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @swagger
 * /api/pdf/teacher/{teacherId}/export:
 *   get:
 *     summary: Export teacher schedule to PDF
 *     tags: [PDF Export]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Academic year ID (optional)
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
const exportTeacherScheduleToPDF = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { academicYear, semesterGroup } = req.query;

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required'
      });
    }

    console.log(`📄 Generating teacher schedule PDF for: ${teacherId} with semester group: ${semesterGroup || 'all'}`);

    // Get teacher information
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findById(teacherId);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Use the SAME PDF service as the working class routine export with semester filtering
    const PDFRoutineService = require('../services/PDFRoutineService');
    const pdfService = new PDFRoutineService();
    const pdfBuffer = await pdfService.generateTeacherSchedulePDF(teacherId, teacher.fullName, semesterGroup || 'all');

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: 'No schedule data found for this teacher'
      });
    }

    // Set response headers with semester group indicator
    const semesterSuffix = semesterGroup && semesterGroup !== 'all' ? `_${semesterGroup.toUpperCase()}` : '';
    const fileName = `${teacher.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_Schedule${semesterSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

    console.log(`✅ Teacher schedule PDF generated: ${fileName}`);

  } catch (error) {
    console.error('❌ Teacher schedule PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate teacher schedule PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @swagger
 * /api/pdf/teacher/export/all:
 *   get:
 *     summary: Export all teachers' schedules to PDF
 *     tags: [PDF Export]
 *     parameters:
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Academic year ID (optional)
 *     responses:
 *       200:
 *         description: PDF file generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
const exportAllTeachersSchedulesToPDF = async (req, res) => {
  try {
    const { academicYear, semesterGroup } = req.query;

    console.log(`📄 Generating all teachers schedules PDF with semester group: ${semesterGroup || 'all'}`);

    // Use the SAME PDF service as the working class routine export
    const PDFRoutineService = require('../services/PDFRoutineService');
    const pdfService = new PDFRoutineService();
    const pdfBuffer = await pdfService.generateAllTeachersSchedulesPDF(semesterGroup || 'all');

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: 'No teacher schedule data found'
      });
    }

    // Set response headers with semester group indicator
    const semesterSuffix = semesterGroup && semesterGroup !== 'all' ? `_${semesterGroup.toUpperCase()}` : '';
    const fileName = `All_Teachers_Schedules${semesterSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

    console.log(`✅ All teachers schedules PDF generated: ${fileName}`);

  } catch (error) {
    console.error('❌ All teachers schedules PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate all teachers schedules PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @swagger
 * /api/pdf/room/{roomId}/export:
 *   get:
 *     summary: Export room schedule to PDF
 *     tags: [PDF Export]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Academic year ID (optional)
 *     responses:
 *       200:
 *         description: PDF file generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
const exportRoomScheduleToPDF = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { academicYear, semesterGroup } = req.query;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    console.log(`📄 Generating room schedule PDF for: ${roomId} with semester group: ${semesterGroup || 'all'}`);

    // Get room information
    const Room = require('../models/Room');
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Use the SAME PDF service as the working class routine export with semester filtering
    const PDFRoutineService = require('../services/PDFRoutineService');
    const pdfService = new PDFRoutineService();
    const pdfBuffer = await pdfService.generateRoomSchedulePDF(roomId, room.name, semesterGroup || 'all');

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: 'No schedule data found for this room'
      });
    }

    // Set response headers with semester group indicator
    const semesterSuffix = semesterGroup && semesterGroup !== 'all' ? `_${semesterGroup.toUpperCase()}` : '';
    const fileName = `${room.name.replace(/[^a-zA-Z0-9]/g, '_')}_Schedule${semesterSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

    console.log(`✅ Room schedule PDF generated: ${fileName}`);

  } catch (error) {
    console.error('❌ Room schedule PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate room schedule PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @swagger
 * /api/pdf/room/export/all:
 *   get:
 *     summary: Export all room schedules to PDF
 *     tags: [PDF Export]
 *     parameters:
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Academic year ID (optional)
 *     responses:
 *       200:
 *         description: PDF file generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
const exportAllRoomSchedulesToPDF = async (req, res) => {
  try {
    const { academicYear, semesterGroup } = req.query;

    console.log(`📄 Generating all room schedules PDF with semester group: ${semesterGroup || 'all'}`);

    // Use the working PDFRoutineService with semester filtering
    const PDFRoutineService = require('../services/PDFRoutineService');
    const pdfService = new PDFRoutineService();
    const pdfBuffer = await pdfService.generateAllRoomsSchedulePDF(semesterGroup || 'all');

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: 'No room schedule data found'
      });
    }

    // Set response headers with semester group indicator
    const semesterSuffix = semesterGroup && semesterGroup !== 'all' ? `_${semesterGroup.toUpperCase()}` : '';
    const fileName = `All_Room_Schedules${semesterSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

    console.log(`✅ All room schedules PDF generated: ${fileName}`);

  } catch (error) {
    console.error('❌ All room schedules PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate all room schedules PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @swagger
 * /api/pdf/teacher/workload/{teacherId}:
 *   get:
 *     summary: Export teacher workload report to PDF
 *     tags: [PDF Export]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
 *     responses:
 *       200:
 *         description: PDF file generated successfully
 */
const exportTeacherWorkloadReport = async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log(`📊 Generating workload report for teacher: ${teacherId}`);

    // Generate PDF workload report
    const teacherGenerator = createPDFGenerator('teacher');
    const pdfBuffer = await teacherGenerator.generateTeacherWorkloadReport(teacherId);

    // Get teacher name for filename
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findById(teacherId);
    const teacherName = teacher ? (teacher.fullName || teacher.shortName) : 'Teacher';

    // Set response headers
    const fileName = `${teacherName.replace(/[^a-zA-Z0-9]/g, '_')}_Workload_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

    console.log(`✅ Teacher workload report PDF generated: ${fileName}`);

  } catch (error) {
    console.error('❌ Teacher workload report PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate teacher workload report PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @swagger
 * /api/pdf/room/utilization/{roomId}:
 *   get:
 *     summary: Export room utilization report to PDF
 *     tags: [PDF Export]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: PDF file generated successfully
 */
const exportRoomUtilizationReport = async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log(`🏢 Generating utilization report for room: ${roomId}`);

    // Generate PDF utilization report
    const roomGenerator = createPDFGenerator('room');
    const pdfBuffer = await roomGenerator.generateRoomUtilizationReport(roomId);

    // Get room name for filename
    const Room = require('../models/Room');
    const room = await Room.findById(roomId);
    const roomName = room ? room.name : 'Room';

    // Set response headers
    const fileName = `${roomName.replace(/[^a-zA-Z0-9]/g, '_')}_Utilization_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

    console.log(`✅ Room utilization report PDF generated: ${fileName}`);

  } catch (error) {
    console.error('❌ Room utilization report PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate room utilization report PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @swagger
 * /api/pdf/room/building/{buildingId}/export:
 *   get:
 *     summary: Export all rooms schedules in a building to PDF
 *     tags: [PDF Export]
 *     parameters:
 *       - in: path
 *         name: buildingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Building ID
 *     responses:
 *       200:
 *         description: PDF file generated successfully
 */
const exportBuildingRoomsSchedulesToPDF = async (req, res) => {
  try {
    const { buildingId } = req.params;
    console.log(`🏢 Generating building rooms schedules PDF for building: ${buildingId}`);

    // Generate PDF for building rooms
    const roomGenerator = createPDFGenerator('room');
    const pdfBuffer = await roomGenerator.generateBuildingRoomsSchedulePDF(buildingId);

    // Get building name for filename
    const Building = require('../models/Building');
    const building = await Building.findById(buildingId);
    const buildingName = building ? building.name : 'Building';

    // Set response headers
    const fileName = `${buildingName.replace(/[^a-zA-Z0-9]/g, '_')}_Rooms_Schedules_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

    console.log(`✅ Building rooms schedules PDF generated: ${fileName}`);

  } catch (error) {
    console.error('❌ Building rooms schedules PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate building rooms schedules PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Enhanced batch export - uses new modular generator methods
 * @swagger
 * /api/pdf/teacher/enhanced/all:
 *   get:
 *     summary: Export all teachers' schedules using enhanced generator
 *     tags: [PDF Export]
 *     responses:
 *       200:
 *         description: PDF file generated successfully
 */
const exportEnhancedAllTeachersSchedules = async (req, res) => {
  try {
    console.log('📚 Generating enhanced all teachers schedules PDF...');

    // Use the enhanced generator method
    const teacherGenerator = createPDFGenerator('teacher');
    const pdfBuffer = await teacherGenerator.generateAllTeachersSchedulePDF();

    // Set response headers
    const fileName = `Enhanced_All_Teachers_Schedules_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

    console.log(`✅ Enhanced all teachers schedules PDF generated: ${fileName}`);

  } catch (error) {
    console.error('❌ Enhanced all teachers schedules PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate enhanced all teachers schedules PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Enhanced batch export for rooms
 * @swagger
 * /api/pdf/room/enhanced/all:
 *   get:
 *     summary: Export all rooms' schedules using enhanced generator
 *     tags: [PDF Export]
 *     responses:
 *       200:
 *         description: PDF file generated successfully
 */
const exportEnhancedAllRoomsSchedules = async (req, res) => {
  try {
    console.log('🏢 Generating enhanced all rooms schedules PDF...');

    // Use the enhanced generator method
    const roomGenerator = createPDFGenerator('room');
    const pdfBuffer = await roomGenerator.generateAllRoomsSchedulePDF();

    // Set response headers
    const fileName = `Enhanced_All_Rooms_Schedules_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

    console.log(`✅ Enhanced all rooms schedules PDF generated: ${fileName}`);

  } catch (error) {
    console.error('❌ Enhanced all rooms schedules PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate enhanced all rooms schedules PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  exportRoutineToPDF,
  exportTeacherScheduleToPDF,
  exportAllTeachersSchedulesToPDF,
  exportRoomScheduleToPDF,
  exportAllRoomSchedulesToPDF,
  // Enhanced functionality
  exportTeacherWorkloadReport,
  exportRoomUtilizationReport,
  exportBuildingRoomsSchedulesToPDF,
  exportEnhancedAllTeachersSchedules,
  exportEnhancedAllRoomsSchedules
};
