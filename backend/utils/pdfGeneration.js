const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { processRoutineSlots, processMultiGroupClasses } = require('./routineDataProcessor');

// Base PDF Generation Service - Scalable Architecture
class PDFGenerationService {
  constructor() {
    this.defaultConfig = {
      size: 'A4',
      layout: 'landscape',
      margins: { top: 40, bottom: 40, left: 30, right: 30 }
    };
    
    this.colors = {
      primary: '#667EEA',
      secondary: '#764BA2',
      text: '#333333',
      lightText: '#666666',
      border: '#c0c0c0',
      background: '#ffffff',
      headerBg: '#f8f9fa',
      breakBg: '#f5f5f5'
    };
    
    this.dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  }

  /**
   * Create a new PDF document with standard configuration
   * @param {Object} config - PDF configuration
   * @returns {PDFDocument} - PDF document instance
   */
  createDocument(config = {}) {
    return new PDFDocument({
      ...this.defaultConfig,
      ...config
    });
  }

  /**
   * Convert PDF document to buffer
   * @param {PDFDocument} doc - PDF document
   * @returns {Promise<Buffer>} - PDF buffer
   */
  documentToBuffer(doc) {
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  /**
   * Add standard header to PDF
   * @param {PDFDocument} doc - PDF document
   * @param {Object} headerInfo - Header information
   */
  addHeader(doc, headerInfo) {
    const { title, subtitle, institutionName = 'IOE Pulchowk Campus', academicYear } = headerInfo;
    
    // Main title
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor(this.colors.text)
       .text(title, doc.options.margins.left, 50, {
         align: 'center',
         width: doc.page.width - doc.options.margins.left - doc.options.margins.right
       });

    // Institution and subtitle
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(this.colors.lightText)
       .text(institutionName, doc.options.margins.left, 75, { align: 'center' });

    if (subtitle) {
      doc.text(subtitle, doc.options.margins.left, 90, { align: 'center' });
    }

    if (academicYear) {
      doc.text(`Academic Year: ${academicYear}`, doc.options.margins.left, 105, { align: 'center' });
    }

    return 130; // Return Y position for content start
  }

  /**
   * Add footer to PDF
   * @param {PDFDocument} doc - PDF document
   */
  addFooter(doc) {
    const footerY = doc.page.height - 30;
    
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor(this.colors.lightText)
       .text(`Generated on: ${new Date().toLocaleDateString()}`, doc.options.margins.left, footerY)
       .text('IOE Pulchowk Campus - Routine Management System', doc.options.margins.left, footerY + 12);
  }

  /**
   * Calculate table dimensions based on content - matches frontend layout
   * @param {Array} timeSlots - Time slots array
   * @param {Object} pageInfo - Page information
   * @returns {Object} - Table dimensions
   */
  calculateTableDimensions(timeSlots, pageInfo) {
    const availableWidth = pageInfo.width - pageInfo.margins.left - pageInfo.margins.right;
    const availableHeight = pageInfo.height - pageInfo.margins.top - pageInfo.margins.bottom - 160; // Space for header/footer
    
    const dayColumnWidth = 150; // Increased for better readability
    const timeColumnWidth = (availableWidth - dayColumnWidth) / timeSlots.length;
    const headerHeight = 35;
    
    // Increase row height to accommodate multi-group classes and elective indicators (matches frontend)
    const rowHeight = Math.min(140, (availableHeight - headerHeight) / this.dayNames.length); // Increased for multi-group
    
    return {
      dayColumnWidth,
      timeColumnWidth,
      headerHeight,
      rowHeight,
      tableWidth: availableWidth,
      tableHeight: headerHeight + (rowHeight * this.dayNames.length)
    };
  }

  /**
   * Draw table structure
   * @param {PDFDocument} doc - PDF document
   * @param {Object} dimensions - Table dimensions
   * @param {Array} timeSlots - Time slots
   * @param {Number} startY - Starting Y position
   */
  drawTableStructure(doc, dimensions, timeSlots, startY) {
    const { dayColumnWidth, timeColumnWidth, headerHeight, rowHeight } = dimensions;
    let currentX = doc.options.margins.left;
    
    // Draw header row
    this.drawTableHeaders(doc, timeSlots, currentX, startY, dayColumnWidth, timeColumnWidth, headerHeight);
    
    // Draw day rows
    this.dayNames.forEach((dayName, dayIndex) => {
      const rowY = startY + headerHeight + (dayIndex * rowHeight);
      this.drawDayRow(doc, dayName, currentX, rowY, dayColumnWidth, timeColumnWidth, rowHeight, timeSlots.length);
    });
  }

  /**
   * Draw table headers
   */
  drawTableHeaders(doc, timeSlots, startX, startY, dayColumnWidth, timeColumnWidth, headerHeight) {
    let currentX = startX;
    
    // Day/Time header
    doc.rect(currentX, startY, dayColumnWidth, headerHeight)
       .fillAndStroke(this.colors.headerBg, this.colors.border)
       .fillColor(this.colors.text)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Day / Time', currentX + 5, startY + 15, {
         width: dayColumnWidth - 10,
         align: 'center'
       });

    currentX += dayColumnWidth;

    // Time slot headers
    timeSlots.forEach((timeSlot) => {
      doc.rect(currentX, startY, timeColumnWidth, headerHeight)
         .fillAndStroke(this.colors.headerBg, this.colors.border)
         .fillColor(this.colors.text)
         .fontSize(9)
         .font('Helvetica-Bold');

      if (timeSlot.isBreak) {
        doc.text('BREAK', currentX + 5, startY + 18, {
          width: timeColumnWidth - 10,
          align: 'center'
        });
      } else {
        doc.text(`${timeSlot.startTime}-${timeSlot.endTime}`, currentX + 5, startY + 18, {
          width: timeColumnWidth - 10,
          align: 'center'
        });
      }
      currentX += timeColumnWidth;
    });
  }

  /**
   * Draw day row
   */
  drawDayRow(doc, dayName, startX, startY, dayColumnWidth, timeColumnWidth, rowHeight, timeSlotCount) {
    // Day name cell
    doc.rect(startX, startY, dayColumnWidth, rowHeight)
       .fillAndStroke(this.colors.headerBg, this.colors.border)
       .fillColor(this.colors.text)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(dayName, startX + 5, startY + (rowHeight / 2) - 6, {
         width: dayColumnWidth - 10,
         align: 'center'
       });

    // Time slot cells (empty borders)
    let currentX = startX + dayColumnWidth;
    for (let i = 0; i < timeSlotCount; i++) {
      doc.rect(currentX, startY, timeColumnWidth, rowHeight)
         .stroke(this.colors.border);
      currentX += timeColumnWidth;
    }
  }

  /**
   * Fill cell with class data
   * @param {PDFDocument} doc - PDF document
   * @param {Object} classData - Class information
   * @param {Number} x - X position
   * @param {Number} y - Y position
   * @param {Number} width - Cell width
   * @param {Number} height - Cell height
   * @param {Boolean} isBreak - Is break slot
   */
  fillClassCell(doc, classData, x, y, width, height, isBreak = false) {
    if (isBreak) {
      doc.rect(x, y, width, height)
         .fillAndStroke(this.colors.breakBg, this.colors.border)
         .fillColor(this.colors.lightText)
         .fontSize(10)
         .font('Helvetica-Bold-Oblique')
         .text('BREAK', x + 5, y + (height / 2) - 5, {
           width: width - 10,
           align: 'center'
         });
      return;
    }

    if (!classData) {
      // Empty cell
      doc.rect(x, y, width, height)
         .fillAndStroke(this.colors.background, this.colors.border);
      return;
    }

    // Class data cell
    doc.rect(x, y, width, height)
       .fillAndStroke(this.colors.background, this.colors.border);

    // Cell content layout
    this.renderClassContent(doc, classData, x, y, width, height);
  }

  /**
   * Render class content in cell - matches frontend exactly
   */
  renderClassContent(doc, classData, x, y, width, height) {
    const padding = 6;
    const contentX = x + padding;
    const contentWidth = width - (padding * 2);
    let currentY = y + padding;
    const lineHeight = 12;

    // Check if this is a multi-group slot (Group A and Group B) - matches frontend
    if (classData.isMultiGroup && classData.groups && classData.groups.length > 1) {
      const groupCount = classData.groups.length;
      const groupHeight = (height - padding * 2) / groupCount;
      
      classData.groups.forEach((group, index) => {
        const groupY = currentY + (index * groupHeight);
        
        // Add more prominent border between groups (matches frontend styling)
        if (index > 0) {
          const borderY = groupY - 4;
          // Draw a more visible separator line
          doc.strokeColor('#cccccc')
             .lineWidth(1.5)
             .moveTo(contentX - 2, borderY)
             .lineTo(contentX + contentWidth + 2, borderY)
             .stroke();
             
          // Add subtle background shading for better separation
          doc.rect(contentX - 2, borderY - 1, contentWidth + 4, 2)
             .fillColor('#f8f8f8')
             .fill();
        }

        let groupCurrentY = groupY + 4;

        // Subject Name with Group indicator (matches frontend exactly)
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(this.colors.text);
        
        const subjectText = this.getSubjectDisplayText(group);
        doc.text(subjectText, contentX, groupCurrentY, {
          width: contentWidth,
          align: 'center',
          lineBreak: false
        });
        groupCurrentY += 12;
        
        // Lab group label on same line as subject (if exists)
        const labGroupLabel = this.getLabGroupLabel(classData, group);
        if (labGroupLabel) {
          doc.fontSize(8)
             .font('Helvetica')
             .fillColor('#666');
          doc.text(labGroupLabel, contentX, groupCurrentY, {
            width: contentWidth,
            align: 'center'
          });
          groupCurrentY += 10;
        }

        // Class Type
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#666');
        doc.text(`[${this.getClassTypeText(group.classType)}]`, contentX, groupCurrentY, {
          width: contentWidth,
          align: 'center'
        });
        groupCurrentY += 10;

        // Teacher (if not teacher view mode and not room view mode)
        if (!classData.hideTeacher && !classData.hideRoom) {
          doc.fontSize(8)
             .fillColor('#666');
          const teachers = Array.isArray(group.teacherShortNames) ? 
                          group.teacherShortNames.join(', ') : 
                          group.teacherShortNames || 'TBA';
          doc.text(teachers, contentX, groupCurrentY, {
            width: contentWidth,
            align: 'center'
          });
          groupCurrentY += 10;
        }

        // Room (if not room view mode)
        if (!classData.hideRoom) {
          doc.fontSize(8)
             .fillColor('#666');
          doc.text(group.roomName || 'TBA', contentX, groupCurrentY, {
            width: contentWidth,
            align: 'center'
          });
        }

        // Program-Semester-Section (show in room view mode)
        if (classData.hideRoom && group.programSemesterSection) {
          doc.fontSize(6)
             .fillColor('#666');
          doc.text(group.programSemesterSection, contentX, groupCurrentY, {
            width: contentWidth,
            align: 'center'
          });
          groupCurrentY += 8;
        }

        // Teacher (show in room view mode)
        if (classData.hideRoom) {
          doc.fontSize(6)
             .fillColor('#666');
          const teachers = Array.isArray(group.teacherShortNames) ? 
                          group.teacherShortNames.join(', ') : 
                          group.teacherShortNames || group.teacherNames?.join(', ') || 'TBA';
          doc.text(teachers, contentX, groupCurrentY, {
            width: contentWidth,
            align: 'center'
          });
        }
      });

      // Elective indicator for multi-group classes - displayed at the bottom (matches frontend)
      if (classData.isElectiveClass) {
        const electiveY = y + height - 18;
        doc.fontSize(7)
           .font('Helvetica')
           .fillColor('#ffffff');
        
        const labelText = classData.electiveLabel || 'Elective';
        const labelWidth = Math.min(contentWidth, doc.widthOfString(labelText) + 12);
        const labelX = contentX + (contentWidth - labelWidth) / 2;
        
        doc.roundedRect(labelX, electiveY, labelWidth, 12, 3)
           .fill('#666666');
        
        doc.text(labelText, labelX, electiveY + 3, {
          width: labelWidth,
          align: 'center'
        });
      }

      return;
    }

    // Single group/class display (matches frontend logic exactly)
    
    // Subject Name with Lab Group indicator (matches frontend)
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(this.colors.text);
    
    const subjectText = this.getSubjectDisplayText(classData);
    doc.text(subjectText, contentX, currentY, {
      width: contentWidth,
      align: 'center',
      lineBreak: false
    });

    // Show lab group indicator for practical classes or alternative week classes (matches frontend)
    if ((classData.classType === 'P' || classData.isAlternativeWeek === true) && classData.labGroup) {
      const labGroupLabel = this.getLabGroupLabel(classData);
      if (labGroupLabel) {
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#666');
        doc.text(labGroupLabel, contentX, currentY + 14, {
          width: contentWidth,
          align: 'center'
        });
        currentY += 14;
      }
    }
    currentY += 14;

    // Class Type
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#666');
    doc.text(`[${this.getClassTypeText(classData.classType || classData.type)}]`, contentX, currentY, {
      width: contentWidth,
      align: 'center'
    });
    currentY += 12;

    // Teacher (if not teacher view and not room view)
    if (!classData.hideTeacher && !classData.hideRoom) {
      doc.fontSize(9)
         .fillColor('#666');
      doc.text(`${this.formatTeachers(classData)}`, contentX, currentY, {
        width: contentWidth,
        align: 'center',
        lineBreak: false
      });
      currentY += 12;
    }

    // Room (if not room view)
    if (!classData.hideRoom) {
      doc.fontSize(9)
         .fillColor('#666');
      doc.text(`${this.formatRoom(classData)}`, contentX, currentY, {
        width: contentWidth,
        align: 'center',
        lineBreak: false
      });
      currentY += 12;
    }

    // Program-Semester-Section (show in room view mode) - matches frontend
    if (classData.hideRoom && classData.programSemesterSection) {
      doc.fontSize(7)
         .fillColor('#666');
      doc.text(classData.programSemesterSection, contentX, currentY, {
        width: contentWidth,
        align: 'center'
      });
      currentY += 10;
    }

    // Teacher (show in room view mode) - matches frontend
    if (classData.hideRoom) {
      doc.fontSize(7)
         .fillColor('#666');
      doc.text(`${this.formatTeachers(classData)}`, contentX, currentY, {
        width: contentWidth,
        align: 'center',
        lineBreak: false
      });
      currentY += 10;
    }

    // Elective indicator - displayed at the bottom (matches frontend exactly)
    if (classData.isElectiveClass) {
      const electiveY = y + height - 18;
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor('#ffffff');
      
      const labelText = classData.electiveLabel || 'Elective';
      const labelWidth = Math.min(contentWidth, doc.widthOfString(labelText) + 12);
      const labelX = contentX + (contentWidth - labelWidth) / 2;
      
      doc.roundedRect(labelX, electiveY, labelWidth, 12, 3)
         .fill('#666666');
      
      doc.text(labelText, labelX, electiveY + 3, {
        width: labelWidth,
        align: 'center'
      });
    }
  }

  /**
   * Format subject display text - matches frontend exactly
   */
  getSubjectDisplayText(classData) {
    // For elective classes, show subject codes instead of full names (matches frontend)
    if (classData.isElectiveClass) {
      // If it has multiple subjects (like "CE752, CT754"), extract codes
      if (classData.displayName && classData.displayName.includes(' - ')) {
        const parts = classData.displayName.split(' - ');
        if (parts.length > 1) {
          // Extract the subject codes part (e.g., "CE752, CT754")
          const subjectsPart = parts[1];
          return subjectsPart;
        }
      }
      // Fallback to subject code if available
      return classData.subjectCode || classData.subjectName || 'Elective';
    }
    
    // For non-elective classes, show full subject name (not code) - matches frontend
    return classData.subjectName || classData.subject || classData.subjectCode || 'N/A';
  }

  /**
   * Generate lab group label matching frontend logic
   */
  getLabGroupLabel(classData, group = null) {
    const isAltWeek = classData.isAlternativeWeek === true;
    
    // For multi-group classes, use the individual group data
    if (group) {
      if (group.labGroupLabel) {
        return isAltWeek ? `${group.labGroupLabel} - Alt Week` : group.labGroupLabel;
      }
      
      const groupLetter = group.labGroup;
      return isAltWeek ? `(Group ${groupLetter} - Alt Week)` : `(Group ${groupLetter})`;
    }
    
    // For single classes, use backend-provided labGroupLabel if available
    if (classData.labGroupLabel) {
      return isAltWeek ? `${classData.labGroupLabel} - Alt Week` : classData.labGroupLabel;
    }
    
    // Alternative week handling
    if (isAltWeek) {
      const sectionGroups = classData.section === 'CD' ? ['C', 'D'] : ['A', 'B'];
      if (classData.labGroup === 'ALL') {
        return `(Groups ${sectionGroups.join(' & ')} - Alt Week)`;
      }
      return classData.labGroup ? `(Group ${classData.labGroup} - Alt Week)` : '(Alt Week)';
    }
    
    // Regular lab group labels - use section-aware mapping
    if (classData.labGroup) {
      const sectionGroups = classData.section === 'CD' ? ['C', 'D'] : ['A', 'B'];
      if (classData.labGroup === 'ALL') {
        return `(Groups ${sectionGroups.join(' & ')})`;
      }
      // Map the lab group based on section
      if (classData.section === 'CD') {
        if (classData.labGroup === 'A') return '(Group C)';
        if (classData.labGroup === 'B') return '(Group D)';
      } else {
        if (classData.labGroup === 'A') return '(Group A)';
        if (classData.labGroup === 'B') return '(Group B)';
      }
      // Direct mapping for C, D groups
      if (classData.labGroup === 'C') return '(Group C)';
      if (classData.labGroup === 'D') return '(Group D)';
      return `(Group ${classData.labGroup})`;
    }
    
    return '';
  }

  /**
   * Format class type text
   */
  getClassTypeText(classType) {
    switch (classType) {
      case 'L': return 'Lecture';
      case 'P': return 'Practical';
      case 'T': return 'Tutorial';
      default: return classType || 'Class';
    }
  }

  /**
   * Format teacher names
   */
  formatTeachers(classData) {
    if (classData.isMultiGroup && classData.groups) {
      const teachers = classData.groups.map(group => 
        Array.isArray(group.teacherShortNames) ? group.teacherShortNames.join(', ') : 
        group.teacherShortNames || group.teacherNames || 'TBA'
      );
      return teachers.join(' / ');
    }
    
    if (Array.isArray(classData.teacherShortNames)) {
      return classData.teacherShortNames.join(', ');
    }
    
    if (Array.isArray(classData.teacherNames)) {
      return classData.teacherNames.join(', ');
    }
    
    return classData.teacherShortNames || classData.teacherNames || classData.teacher || 'TBA';
  }

  /**
   * Format room information
   */
  formatRoom(classData) {
    if (classData.isMultiGroup && classData.groups) {
      const rooms = classData.groups.map(group => group.roomName || group.room || 'TBA');
      return rooms.join(' / ');
    }
    
    return classData.roomName || classData.room || 'TBA';
  }
}

// Specialized PDF generators using the base service
class RoutinePDFGenerator extends PDFGenerationService {
  constructor() {
    super();
    // Lazy load models to avoid database connection issues
    this._RoutineSlot = null;
    this._TimeSlotDefinition = null;
  }

  get RoutineSlot() {
    if (!this._RoutineSlot) {
      this._RoutineSlot = require('../models/RoutineSlot');
    }
    return this._RoutineSlot;
  }

  get TimeSlotDefinition() {
    if (!this._TimeSlotDefinition) {
      this._TimeSlotDefinition = require('../models/TimeSlot');
    }
    return this._TimeSlotDefinition;
  }

  /**
   * Generate PDF file for class routine
   * @param {String} programCode - Program code (e.g., 'BCT')
   * @param {Number} semester - Semester number
   * @param {String} section - Section (e.g., 'AB', 'CD')
   * @returns {Buffer} - PDF file buffer
   */
  async generateClassRoutinePDF(programCode, semester, section) {
    try {
      const doc = this.createDocument();

      // Get time slots for headers - ROBUST SORTING
      let timeSlots = await this.TimeSlotDefinition.find().sort({ sortOrder: 1, _id: 1 });
      
      if (timeSlots.length === 0 || timeSlots.some(slot => slot.sortOrder == null)) {
        console.warn('⚠️  TimeSlots missing sortOrder, falling back to startTime sorting');
        timeSlots = await this.TimeSlotDefinition.find().sort({ startTime: 1 });
      }
      
      console.log('📅 PDF Time Slots (sorted):', timeSlots.map((slot, idx) => ({ 
        idx, 
        id: slot._id, 
        time: `${slot.startTime}-${slot.endTime}`,
        sortOrder: slot.sortOrder,
        isBreak: slot.isBreak 
      })));
      
      // Get routine slots with enhanced population - SAME AS FRONTEND API
      const routineSlots = await this.RoutineSlot.find({
        programCode: programCode.toUpperCase(),
        semester: parseInt(semester),
        section: section.toUpperCase(),
        isActive: true
      })
        .populate('subjectId', 'name code')
        .populate('subjectIds', 'name code') // Populate multiple subjects for electives
        .populate('teacherIds', 'fullName shortName')
        .populate('roomId', 'name')
        .sort({ dayIndex: 1, slotIndex: 1 });

      // Process routine data using shared logic - ENSURES CONSISTENCY WITH FRONTEND
      const routineData = processRoutineSlots(routineSlots, { viewMode: 'class' });
      const processedRoutine = processMultiGroupClasses(routineData);

      // Add header
      const startY = this.addHeader(doc, {
        title: `${programCode.toUpperCase()} Semester ${semester} Section ${section.toUpperCase()} - Class Routine`,
        institutionName: 'IOE Pulchowk Campus',
        academicYear: new Date().getFullYear()
      });

      // Create routine grid using processed data
      const routineGrid = this.createRoutineGridFromProcessedData(processedRoutine, timeSlots);

      // Calculate table dimensions
      const dimensions = this.calculateTableDimensions(timeSlots, {
        width: doc.page.width,
        height: doc.page.height,
        margins: doc.options.margins
      });

      // Draw table structure
      this.drawTableStructure(doc, dimensions, timeSlots, startY);

      // Fill cells with class data
      this.fillRoutineData(doc, routineGrid, timeSlots, dimensions, startY);

      // Add footer
      this.addFooter(doc);

      // Finalize the PDF
      doc.end();

      return this.documentToBuffer(doc);

    } catch (error) {
      console.error('Error generating class routine PDF:', error);
      throw error;
    }
  }

  /**
   * Create routine grid from processed data - matches frontend exactly
   */
  createRoutineGridFromProcessedData(processedRoutine, timeSlots) {
    const grid = {};
    
    // Initialize grid structure
    this.dayNames.forEach((_, dayIndex) => {
      grid[dayIndex] = {};
      timeSlots.forEach((timeSlot, slotIndex) => {
        grid[dayIndex][slotIndex] = null;
      });
    });

    // Populate grid with processed data
    Object.keys(processedRoutine).forEach(dayIndex => {
      const dayData = processedRoutine[dayIndex];
      Object.keys(dayData).forEach(slotIndex => {
        const classData = dayData[slotIndex];
        if (classData) {
          grid[parseInt(dayIndex)][parseInt(slotIndex)] = classData;
        }
      });
    });

    return grid;
  }

  /**
   * Create empty routine grid structure - EXACTLY matches frontend
   */
  createRoutineGrid(timeSlots) {
    const grid = {};
    this.dayNames.forEach((_, dayIndex) => {
      grid[dayIndex] = {};
      // Use timeSlot._id as keys (matches frontend exactly)
      timeSlots.forEach(timeSlot => {
        grid[dayIndex][timeSlot._id] = null;
      });
    });
    return grid;
  }

  /**
   * Populate routine grid with class data - ENHANCED to work with slotIndex
   * This function has been updated to use slotIndex instead of timeSlotId
   * to match the frontend behavior when timeSlotId is missing
   */
  populateRoutineGrid(grid, routineSlots, timeSlots) {
    console.log('📊 PDF Generation - Enhanced Time slot mapping:');
    console.log('Time slots:', timeSlots.map((ts, idx) => ({ 
      idx, 
      id: ts._id, 
      sortOrder: ts.sortOrder, 
      time: `${ts.startTime}-${ts.endTime}`,
      isBreak: ts.isBreak 
    })));
    
    // ENHANCED FIX: Create more robust mapping from slotIndex to timeSlot._id 
    const slotIndexToTimeSlotId = {};
    
    // First try to use sortOrder property for mapping (if available)
    if (timeSlots.every(slot => slot.sortOrder !== undefined)) {
      console.log('Using sortOrder for mapping (most precise)');
      // sortOrder is 1-based but slotIndex is 0-based, so adjust accordingly
      timeSlots.forEach(timeSlot => {
        const index = timeSlot.sortOrder - 1;
        slotIndexToTimeSlotId[index] = timeSlot._id;
      });
    } else {
      // Fall back to array position
      console.log('Using array position for mapping (fallback)');
      timeSlots.forEach((timeSlot, arrayIndex) => {
        slotIndexToTimeSlotId[arrayIndex] = timeSlot._id;
      });
    }
    
    console.log('SlotIndex to TimeSlot._id mapping:', slotIndexToTimeSlotId);

    // Group slots by day and timeSlot._id for multi-group handling (matches frontend logic)
    const groupedSlots = {};

    routineSlots.forEach(slot => {
      console.log(`Processing slot: day=${slot.dayIndex}, slotIndex=${slot.slotIndex}, subject=${slot.subjectId?.name}`);
      
      // FIX: Use slotIndex directly instead of relying on timeSlotId
      // This aligns with how the frontend displays the routine
      const slotIndex = slot.slotIndex;
      
      // Map the slotIndex to corresponding timeSlot._id
      const timeSlotId = slotIndexToTimeSlotId[slotIndex];
      
      if (!timeSlotId) {
        console.warn(`No timeSlot._id found for slotIndex ${slotIndex}, skipping`);
        return;
      }
      
      const key = `${slot.dayIndex}-${timeSlotId}`;
      if (!groupedSlots[key]) {
        groupedSlots[key] = [];
      }
      groupedSlots[key].push(slot);
    });

    console.log('Grouped routine slots by timeSlot._id:', Object.keys(groupedSlots).map(key => ({
      key,
      count: groupedSlots[key].length,
      subject: groupedSlots[key][0]?.subjectId?.name || 'N/A'
    })));

    // Process grouped slots - use timeSlot._id as grid keys (matches frontend)
    Object.keys(groupedSlots).forEach(key => {
      const [dayIndex, timeSlotId] = key.split('-');
      const slots = groupedSlots[key];
      const dayIdx = parseInt(dayIndex);

      console.log(`Storing data for day=${dayIdx}, timeSlotId=${timeSlotId}`);

      if (slots.length === 1) {
        // Single class
        const slot = slots[0];
        grid[dayIdx][timeSlotId] = this.formatSingleClass(slot);
      } else if (slots.length > 1) {
        // Multiple classes (lab groups) - combine into single multi-group cell (matches frontend)
        grid[dayIdx][timeSlotId] = this.formatMultiGroupClass(slots);
      }
    });

    return grid;
  }

  /**
   * Format single class data
   */
  formatSingleClass(slot) {
    const teacherNames = slot.teacherIds?.map(t => t.shortName || t.fullName).join(', ') || 'TBA';
    const roomName = slot.roomId?.name || 'TBA';
    const subjectName = slot.subjectId?.name || 'N/A';
    const subjectCode = slot.subjectId?.code || 'N/A';

    return {
      subjectName: subjectName,  // This should be the full name
      subjectCode: subjectCode,
      teacherNames: teacherNames,
      teacherShortNames: teacherNames,
      roomName: roomName,
      classType: slot.classType,
      labGroup: slot.labGroup,
      isElectiveClass: slot.isElectiveClass,
      electiveLabel: slot.electiveLabel,
      isAlternativeWeek: slot.isAlternativeWeek,
      notes: slot.notes,
      // Add spanning information
      spanId: slot.spanId,
      spanMaster: slot.spanMaster
    };
  }

  /**
   * Format multi-group class data
   */
  formatMultiGroupClass(slots) {
    const groups = slots.map(slot => this.formatSingleClass(slot));
    
    // Check if any of the groups have spanning information
    const hasSpan = groups.some(g => g.spanId);
    const spanMaster = groups.find(g => g.spanMaster);
    
    // Take slotIndex from first slot - CRITICAL for proper positioning
    const firstSlot = slots[0];
    
    return {
      isMultiGroup: true,
      groups: groups,
      // Store slotIndex for proper positioning - this is the key fix
      slotIndex: firstSlot.slotIndex,
      // Ensure we include dayIndex for proper positioning
      dayIndex: firstSlot.dayIndex,
      subjectName: groups.map(g => g.subjectName).join(' / '),
      subjectCode: groups.map(g => g.subjectCode).join(' / '),
      teacherNames: groups.map(g => g.teacherNames).join(' / '),
      roomName: groups.map(g => g.roomName).join(' / '),
      classType: groups[0].classType,
      isElectiveClass: groups.some(g => g.isElectiveClass),
      // Add spanning information from the master if exists
      spanId: spanMaster?.spanId || groups[0]?.spanId,
      spanMaster: spanMaster?.spanMaster || groups.some(g => g.spanMaster)
    };
  }

  /**
   * Fill routine data into PDF table - EXACTLY matches frontend logic
   */
  fillRoutineData(doc, routineGrid, timeSlots, dimensions, startY) {
    const { dayColumnWidth, timeColumnWidth, headerHeight, rowHeight } = dimensions;

    this.dayNames.forEach((dayName, dayIndex) => {
      const rowY = startY + headerHeight + (dayIndex * rowHeight);
      
      timeSlots.forEach((timeSlot, slotIndex) => {
        const cellX = doc.options.margins.left + dayColumnWidth + (slotIndex * timeColumnWidth);
        
        // CRITICAL FIX: Use slotIndex for data lookup (matches frontend exactly)
        const classData = routineGrid[dayIndex][slotIndex];
        
        console.log(`Processing cell day=${dayIndex}, slotIndex=${slotIndex}, time=${timeSlot.startTime}-${timeSlot.endTime}, hasData=${!!classData}, subject=${classData?.subjectName || 'empty'}`);
        
        // Handle break slots first
        if (timeSlot.isBreak) {
          this.fillClassCell(doc, null, cellX, rowY, timeColumnWidth, rowHeight, true);
          return;
        }
        
        // Frontend spanning logic implementation - matches RoutineGrid.jsx exactly
        const isSpanMaster = classData?.spanMaster === true;
        const isPartOfSpan = classData?.spanId != null;
        
        // Check if this cell should be hidden because it's covered by a span master
        let isHiddenBySpan = false;
        if (isPartOfSpan && !isSpanMaster) {
          // Find the span master for this span group in the same day
          const spanMasterId = classData.spanId;
          const spanMaster = Object.values(routineGrid[dayIndex] || {}).find(
            cell => cell?.spanId === spanMasterId && cell?.spanMaster === true
          );
          
          if (spanMaster) {
            isHiddenBySpan = true;
          }
        }
        
        // EXACT FRONTEND LOGIC: Hidden cells are completely skipped
        if (isHiddenBySpan) {
          console.log(`Skipping hidden span cell: day=${dayIndex}, slot=${slotIndex}, spanId=${classData.spanId}`);
          return;
        }
        
        // Calculate colSpan only for span masters (matches frontend calculateColSpan)
        let colSpan = 1;
        let spanWidth = timeColumnWidth;
        
        if (isSpanMaster) {
          // For the span master, calculate the total span length
          const spanGroup = Object.values(routineGrid[dayIndex] || {}).filter(
            slot => slot?.spanId && slot.spanId === classData.spanId
          );
          colSpan = spanGroup.length;
          spanWidth = colSpan * timeColumnWidth;
          
          console.log(`Rendering span master: day=${dayIndex}, slot=${slotIndex}, spanId=${classData.spanId}, colSpan=${colSpan}`);
        }
        
        // Render the cell (normal cell, empty cell, or span master with colSpan)
        this.fillClassCell(doc, classData, cellX, rowY, spanWidth, rowHeight, false);
      });
    });
  }
}

class TeacherPDFGenerator extends PDFGenerationService {
  constructor() {
    super();
  }

  /**
   * Generate PDF file for teacher schedule
   * @param {Object} teacher - Teacher object
   * @param {Object} scheduleData - Teacher's schedule data from API
   * @returns {Buffer} - PDF file buffer
   */
  async generateTeacherSchedulePDF(teacher, scheduleData) {
    try {
      const doc = this.createDocument();

      // Add header
      const startY = this.addHeader(doc, {
        title: `Teacher Schedule - ${teacher.fullName || teacher.name}`,
        subtitle: `Email: ${teacher.email || 'N/A'} | Phone: ${teacher.phone || 'N/A'}`,
        institutionName: 'IOE Pulchowk Campus',
        academicYear: new Date().getFullYear()
      });

      // Get time slots (assuming they're provided in scheduleData)
      const timeSlots = scheduleData.timeSlots || [];
      
      // Process teacher routine data
      const routineGrid = this.processTeacherSchedule(scheduleData.routine || {});

      // Calculate table dimensions
      const dimensions = this.calculateTableDimensions(timeSlots, {
        width: doc.page.width,
        height: doc.page.height,
        margins: doc.options.margins
      });

      // Draw table structure
      this.drawTableStructure(doc, dimensions, timeSlots, startY);

      // Fill cells with teacher schedule data
      this.fillTeacherScheduleData(doc, routineGrid, timeSlots, dimensions, startY);

      // Add footer
      this.addFooter(doc);

      // Finalize the PDF
      doc.end();

      return this.documentToBuffer(doc);

    } catch (error) {
      console.error('Error generating teacher schedule PDF:', error);
      throw error;
    }
  }

  /**
   * Process teacher schedule data
   */
  processTeacherSchedule(routineData) {
    const grid = {};
    this.dayNames.forEach((_, dayIndex) => {
      grid[dayIndex] = {};
    });

    // Process routine data similar to frontend
    Object.keys(routineData).forEach(dayIndex => {
      const dayData = routineData[dayIndex];
      if (dayData && typeof dayData === 'object') {
        Object.keys(dayData).forEach(slotIndex => {
          const classData = dayData[slotIndex];
          if (classData) {
            // Add program-semester-section info for teacher view
            grid[dayIndex][slotIndex] = {
              ...classData,
              hideTeacher: true, // Don't show teacher name in teacher's own schedule
              programSemesterSection: classData.programSemesterSection
            };
          }
        });
      }
    });

    return grid;
  }

  /**
   * Fill teacher schedule data into PDF table
   */
  fillTeacherScheduleData(doc, routineGrid, timeSlots, dimensions, startY) {
    const { dayColumnWidth, timeColumnWidth, headerHeight, rowHeight } = dimensions;

    this.dayNames.forEach((dayName, dayIndex) => {
      const rowY = startY + headerHeight + (dayIndex * rowHeight);
      
      timeSlots.forEach((timeSlot, timeSlotIndex) => {
        const cellX = doc.options.margins.left + dayColumnWidth + (timeSlotIndex * timeColumnWidth);
        const classData = routineGrid[dayIndex][timeSlotIndex];
        
        this.fillTeacherClassCell(doc, classData, cellX, rowY, timeColumnWidth, rowHeight, timeSlot.isBreak);
      });
    });
  }

  /**
   * Fill teacher-specific class cell
   */
  fillTeacherClassCell(doc, classData, x, y, width, height, isBreak = false) {
    if (isBreak) {
      this.fillClassCell(doc, null, x, y, width, height, true);
      return;
    }

    if (!classData) {
      this.fillClassCell(doc, null, x, y, width, height, false);
      return;
    }

    // Render teacher-specific content
    doc.rect(x, y, width, height)
       .fillAndStroke(this.colors.background, this.colors.border);

    const padding = 3;
    const contentX = x + padding;
    const contentWidth = width - (padding * 2);
    let currentY = y + padding;
    const lineHeight = 9;

    // Subject name
    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(this.colors.text)
       .text(this.getSubjectDisplayText(classData), contentX, currentY, {
         width: contentWidth,
         align: 'center'
       });
    currentY += lineHeight;

    // Program-Semester-Section
    if (classData.programSemesterSection) {
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(this.colors.lightText)
         .text(classData.programSemesterSection, contentX, currentY, {
           width: contentWidth,
           align: 'center'
         });
      currentY += lineHeight;
    }

    // Room
    doc.fontSize(7)
       .fillColor(this.colors.lightText)
       .text(this.formatRoom(classData), contentX, currentY, {
         width: contentWidth,
         align: 'center'
       });
  }
}

class RoomPDFGenerator extends PDFGenerationService {
  constructor() {
    super();
  }

  /**
   * Generate PDF file for room schedule
   * @param {Object} room - Room object
   * @param {Object} scheduleData - Room's schedule data from API
   * @returns {Buffer} - PDF file buffer
   */
  async generateRoomSchedulePDF(room, scheduleData) {
    try {
      const doc = this.createDocument();

      // Add header
      const startY = this.addHeader(doc, {
        title: `Room Schedule - ${room.name}`,
        subtitle: `Capacity: ${room.capacity} | Type: ${room.roomType} | Floor: ${room.floor}`,
        institutionName: 'IOE Pulchowk Campus',
        academicYear: new Date().getFullYear()
      });

      // Get time slots
      const timeSlots = scheduleData.timeSlots || [];
      
      // Process room routine data
      const routineGrid = this.processRoomSchedule(scheduleData.routine || {});

      // Calculate table dimensions
      const dimensions = this.calculateTableDimensions(timeSlots, {
        width: doc.page.width,
        height: doc.page.height,
        margins: doc.options.margins
      });

      // Draw table structure
      this.drawTableStructure(doc, dimensions, timeSlots, startY);

      // Fill cells with room schedule data
      this.fillRoomScheduleData(doc, routineGrid, timeSlots, dimensions, startY);

      // Add footer
      this.addFooter(doc);

      // Finalize the PDF
      doc.end();

      return this.documentToBuffer(doc);

    } catch (error) {
      console.error('Error generating room schedule PDF:', error);
      throw error;
    }
  }

  /**
   * Process room schedule data
   */
  processRoomSchedule(routineData) {
    const grid = {};
    this.dayNames.forEach((_, dayIndex) => {
      grid[dayIndex] = {};
    });

    Object.keys(routineData).forEach(dayIndex => {
      const dayData = routineData[dayIndex];
      if (dayData && typeof dayData === 'object') {
        Object.keys(dayData).forEach(slotIndex => {
          const classData = dayData[slotIndex];
          if (classData) {
            grid[dayIndex][slotIndex] = {
              ...classData,
              hideRoom: true // Don't show room name in room's own schedule
            };
          }
        });
      }
    });

    return grid;
  }

  /**
   * Fill room schedule data into PDF table
   */
  fillRoomScheduleData(doc, routineGrid, timeSlots, dimensions, startY) {
    const { dayColumnWidth, timeColumnWidth, headerHeight, rowHeight } = dimensions;

    this.dayNames.forEach((dayName, dayIndex) => {
      const rowY = startY + headerHeight + (dayIndex * rowHeight);
      
      timeSlots.forEach((timeSlot, timeSlotIndex) => {
        const cellX = doc.options.margins.left + dayColumnWidth + (timeSlotIndex * timeColumnWidth);
        const classData = routineGrid[dayIndex][timeSlotIndex];
        
        this.fillRoomClassCell(doc, classData, cellX, rowY, timeColumnWidth, rowHeight, timeSlot.isBreak);
      });
    });
  }

  /**
   * Fill room-specific class cell
   */
  fillRoomClassCell(doc, classData, x, y, width, height, isBreak = false) {
    if (isBreak) {
      this.fillClassCell(doc, null, x, y, width, height, true);
      return;
    }

    if (!classData) {
      this.fillClassCell(doc, null, x, y, width, height, false);
      return;
    }

    // Render room-specific content
    doc.rect(x, y, width, height)
       .fillAndStroke(this.colors.background, this.colors.border);

    const padding = 3;
    const contentX = x + padding;
    const contentWidth = width - (padding * 2);
    let currentY = y + padding;
    const lineHeight = 9;

    // Subject name
    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(this.colors.text)
       .text(this.getSubjectDisplayText(classData), contentX, currentY, {
         width: contentWidth,
         align: 'center'
       });
    currentY += lineHeight;

    // Program-Semester-Section
    if (classData.programSemesterSection) {
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(this.colors.lightText)
         .text(classData.programSemesterSection, contentX, currentY, {
           width: contentWidth,
           align: 'center'
         });
      currentY += lineHeight;
    }

    // Teacher
    doc.fontSize(7)
       .fillColor(this.colors.lightText)
       .text(this.formatTeachers(classData), contentX, currentY, {
         width: contentWidth,
         align: 'center'
       });
  }
}

// Factory function to create appropriate PDF generator
function createPDFGenerator(type) {
  switch (type) {
    case 'routine':
      return new RoutinePDFGenerator();
    case 'teacher':
      return new TeacherPDFGenerator();
    case 'room':
      return new RoomPDFGenerator();
    default:
      throw new Error(`Unknown PDF generator type: ${type}`);
  }
}

// Export functions for backward compatibility and new scalable approach
const routineGenerator = new RoutinePDFGenerator();
const teacherGenerator = new TeacherPDFGenerator();
const roomGenerator = new RoomPDFGenerator();

module.exports = {
  // Backward compatible exports
  generateClassRoutinePDF: (programCode, semester, section) => 
    routineGenerator.generateClassRoutinePDF(programCode, semester, section),
  
  generateTeacherSchedulePDF: (teacher, scheduleData) => 
    teacherGenerator.generateTeacherSchedulePDF(teacher, scheduleData),
  
  generateRoomSchedulePDF: (room, scheduleData) => 
    roomGenerator.generateRoomSchedulePDF(room, scheduleData),

  // New scalable exports
  PDFGenerationService,
  RoutinePDFGenerator,
  TeacherPDFGenerator,
  RoomPDFGenerator,
  createPDFGenerator
};
