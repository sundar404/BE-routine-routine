const PDFDocument = require('pdfkit');
const RoutineSlot = require('../models/RoutineSlot');
const TimeSlot = require('../models/TimeSlot');
const path = require('path');

class PDFRoutineService {
  constructor() {
    this.pageWidth = 595.28; // A4 width in points
    this.pageHeight = 841.89; // A4 height in points
    this.margin = 40;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.contentHeight = this.pageHeight - (this.margin * 2);
    
    // Grid configuration
    this.dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.colors = {
      header: '#2563eb',
      border: '#e5e7eb',
      lab: '#fef3c7',
      labBorder: '#f59e0b',
      regular: '#ffffff',
      text: '#1f2937',
      lightText: '#6b7280'
    };
  }

  async generateRoomSchedulePDF(roomId, academicYear) {
    try {
      // Fetch room data
      const Room = require('../models/Room');
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Fetch routine slots for this room
      const routineSlots = await RoutineSlot.find({
        roomId: room._id,
        isActive: true
      })
      .populate('teacherIds', 'fullName shortName')
      .populate('subjectId', 'name code')
      .populate('programId', 'name code')
      .sort({ dayIndex: 1, slotIndex: 1 });

      // Fetch time slots
      const timeSlots = await TimeSlot.find({}).sort({ startTime: 1 });

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: {
          top: this.margin,
          bottom: this.margin,
          left: this.margin,
          right: this.margin
        }
      });

      // Generate PDF content
      this.generateHeader(doc, `${room.name} Weekly Schedule`, room);
      this.generateRoutineGrid(doc, routineSlots, timeSlots);
      this.generateFooter(doc);

      return doc;
    } catch (error) {
      console.error('Error generating room schedule PDF:', error);
      throw error;
    }
  }

  async generateClassSchedulePDF(programCode, semester, section, academicYear) {
    try {
      // Fetch routine slots for this class
      const routineSlots = await RoutineSlot.find({
        programCode: programCode,
        semester: semester,
        section: section,
        isActive: true
      })
      .populate('teacherIds', 'fullName shortName')
      .populate('subjectId', 'name code')
      .populate('roomId', 'name building')
      .sort({ dayIndex: 1, slotIndex: 1 });

      // Fetch time slots
      const timeSlots = await TimeSlot.find({}).sort({ startTime: 1 });

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: {
          top: this.margin,
          bottom: this.margin,
          left: this.margin,
          right: this.margin
        }
      });

      // Generate PDF content
      const title = `${programCode} - Semester ${semester} - Section ${section}`;
      this.generateHeader(doc, title);
      this.generateRoutineGrid(doc, routineSlots, timeSlots);
      this.generateFooter(doc);

      return doc;
    } catch (error) {
      console.error('Error generating class schedule PDF:', error);
      throw error;
    }
  }

  generateHeader(doc, title, roomInfo = null) {
    const headerHeight = 80;
    
    // Background for header
    doc.rect(0, 0, doc.page.width, headerHeight)
       .fill(this.colors.header);

    // Title
    doc.fill('#ffffff')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(title, this.margin, 25, {
         width: this.contentWidth,
         align: 'center'
       });

    // Subtitle with room info or academic year
    if (roomInfo) {
      const subtitle = `Building: ${roomInfo.building || 'N/A'} | Capacity: ${roomInfo.capacity || 'N/A'} | Type: ${roomInfo.type || 'Standard'}`;
      doc.fontSize(12)
         .font('Helvetica')
         .text(subtitle, this.margin, 50, {
           width: this.contentWidth,
           align: 'center'
         });
    }

    // Generated date
    const date = new Date().toLocaleDateString();
    doc.fontSize(10)
       .text(`Generated on: ${date}`, this.margin, doc.page.height - 30);

    // Move to content area
    doc.y = headerHeight + 20;
  }

  generateRoutineGrid(doc, routineSlots, timeSlots) {
    const startY = doc.y;
    const gridHeight = 400;
    const cellHeight = 50;
    const headerHeight = 30;
    
    // Calculate column widths
    const timeColumnWidth = 80;
    const dayColumnWidth = (this.contentWidth - timeColumnWidth) / 7;

    // Create routine grid data structure
    const routineGrid = this.createRoutineGrid(routineSlots, timeSlots);
    
    // Draw grid headers
    this.drawGridHeaders(doc, startY, timeColumnWidth, dayColumnWidth, headerHeight);
    
    // Draw time slots and routine data
    this.drawRoutineData(doc, routineGrid, timeSlots, startY + headerHeight, 
                        timeColumnWidth, dayColumnWidth, cellHeight);
  }

  createRoutineGrid(routineSlots, timeSlots) {
    const grid = {};
    
    // Initialize grid
    for (let day = 0; day < 7; day++) {
      grid[day] = {};
      for (let slot of timeSlots) {
        grid[day][slot._id] = [];
      }
    }
    
    // Populate grid with routine slots
    routineSlots.forEach(slot => {
      if (grid[slot.dayIndex] && grid[slot.dayIndex][slot.slotIndex]) {
        grid[slot.dayIndex][slot.slotIndex].push(slot);
      }
    });
    
    return grid;
  }

  drawGridHeaders(doc, startY, timeColumnWidth, dayColumnWidth, headerHeight) {
    // Time column header
    doc.rect(this.margin, startY, timeColumnWidth, headerHeight)
       .stroke(this.colors.border)
       .fill(this.colors.header);
    
    doc.fill('#ffffff')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Time', this.margin + 5, startY + 8, {
         width: timeColumnWidth - 10,
         align: 'center'
       });

    // Day headers
    for (let i = 0; i < 7; i++) {
      const x = this.margin + timeColumnWidth + (i * dayColumnWidth);
      
      doc.rect(x, startY, dayColumnWidth, headerHeight)
         .stroke(this.colors.border)
         .fill(this.colors.header);
      
      doc.fill('#ffffff')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(this.dayNames[i], x + 5, startY + 8, {
           width: dayColumnWidth - 10,
           align: 'center'
         });
    }
  }

  drawRoutineData(doc, routineGrid, timeSlots, startY, timeColumnWidth, dayColumnWidth, cellHeight) {
    let currentY = startY;
    
    timeSlots.forEach((timeSlot, index) => {
      // Draw time slot label
      doc.rect(this.margin, currentY, timeColumnWidth, cellHeight)
         .stroke(this.colors.border)
         .fill('#f9fafb');
      
      doc.fill(this.colors.text)
         .fontSize(10)
         .font('Helvetica')
         .text(this.formatTimeSlot(timeSlot), this.margin + 5, currentY + 15, {
           width: timeColumnWidth - 10,
           align: 'center'
         });

      // Draw routine slots for each day
      for (let day = 0; day < 7; day++) {
        const x = this.margin + timeColumnWidth + (day * dayColumnWidth);
        const slots = routineGrid[day][timeSlot._id] || [];
        
        this.drawRoutineCell(doc, slots, x, currentY, dayColumnWidth, cellHeight);
      }
      
      currentY += cellHeight;
    });
  }

  drawRoutineCell(doc, slots, x, y, width, height) {
    // Determine cell style based on content
    const isLab = slots.some(slot => slot.classType === 'P');
    const bgColor = isLab ? this.colors.lab : this.colors.regular;
    const borderColor = isLab ? this.colors.labBorder : this.colors.border;
    
    // Draw cell background
    doc.rect(x, y, width, height)
       .fill(bgColor)
       .stroke(borderColor);

    if (slots.length === 0) {
      return; // Empty cell
    }

    // Handle multiple slots in one cell
    if (slots.length === 1) {
      this.drawSingleSlot(doc, slots[0], x, y, width, height);
    } else {
      this.drawMultipleSlots(doc, slots, x, y, width, height);
    }
  }

  drawSingleSlot(doc, slot, x, y, width, height) {
    const padding = 3;
    const textWidth = width - (padding * 2);
    
    doc.fill(this.colors.text)
       .fontSize(8)
       .font('Helvetica-Bold');

    let currentY = y + padding;
    
    // Subject name
    if (slot.subjectId) {
      doc.text(slot.subjectId.code || slot.subjectId.name, x + padding, currentY, {
        width: textWidth,
        align: 'center',
        lineGap: 1
      });
      currentY += 10;
    }
    
    // Teacher name
    if (slot.teacherIds && slot.teacherIds.length > 0) {
      const teacherName = slot.teacherIds[0].shortName || slot.teacherIds[0].fullName;
      doc.fontSize(7)
         .font('Helvetica')
         .text(teacherName, x + padding, currentY, {
           width: textWidth,
           align: 'center',
           lineGap: 1
         });
      currentY += 8;
    }
    
    // Room info (for class schedules)
    if (slot.roomId) {
      doc.fontSize(6)
         .text(slot.roomId.name, x + padding, currentY, {
           width: textWidth,
           align: 'center'
         });
    }
    
    // Lab group info
    if (slot.labGroup && slot.labGroup !== 'ALL') {
      doc.fontSize(6)
         .text(`Lab ${slot.labGroup}`, x + padding, currentY + 6, {
           width: textWidth,
           align: 'center'
         });
    }
  }

  drawMultipleSlots(doc, slots, x, y, width, height) {
    const padding = 2;
    const textWidth = width - (padding * 2);
    
    doc.fill(this.colors.text)
       .fontSize(6)
       .font('Helvetica-Bold');

    let currentY = y + padding;
    
    slots.forEach((slot, index) => {
      if (currentY > y + height - 10) return; // Prevent overflow
      
      const subjectCode = slot.subjectId ? (slot.subjectId.code || slot.subjectId.name) : 'N/A';
      const teacherName = slot.teacherIds && slot.teacherIds.length > 0 ? 
                         slot.teacherIds[0].shortName : '';
      
      const text = `${subjectCode}${teacherName ? ` - ${teacherName}` : ''}`;
      
      doc.text(text, x + padding, currentY, {
        width: textWidth,
        align: 'center',
        lineGap: 1
      });
      
      currentY += 8;
    });
  }

  formatTimeSlot(timeSlot) {
    if (timeSlot.startTime && timeSlot.endTime) {
      return `${timeSlot.startTime}-${timeSlot.endTime}`;
    }
    return timeSlot.label || 'N/A';
  }

  generateFooter(doc) {
    const footerY = doc.page.height - 40;
    
    doc.fontSize(8)
       .fill(this.colors.lightText)
       .text('Generated by College Routine Management System', this.margin, footerY, {
         width: this.contentWidth,
         align: 'center'
       });
  }

  async generateAllRoomsSchedulePDF(rooms, academicYear) {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: {
          top: this.margin,
          bottom: this.margin,
          left: this.margin,
          right: this.margin
        }
      });

      // Generate cover page
      this.generateHeader(doc, 'All Rooms Schedule Report');
      
      // Add rooms list
      doc.y += 20;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fill(this.colors.text)
         .text('Included Rooms:', this.margin, doc.y);
      
      doc.y += 20;
      doc.fontSize(12)
         .font('Helvetica');
      
      rooms.forEach((room, index) => {
        doc.text(`${index + 1}. ${room.name} (${room.building || 'N/A'})`, this.margin + 20, doc.y);
        doc.y += 15;
      });

      // Generate individual room schedules
      for (let room of rooms) {
        doc.addPage();
        
        // Fetch routine slots for this room
        const routineSlots = await RoutineSlot.find({
          roomId: room._id,
          isActive: true
        })
        .populate('teacherIds', 'fullName shortName')
        .populate('subjectId', 'name code')
        .populate('programId', 'name code')
        .sort({ dayIndex: 1, slotIndex: 1 });

        // Fetch time slots
        const timeSlots = await TimeSlot.find({}).sort({ startTime: 1 });

        // Generate content for this room
        this.generateHeader(doc, `${room.name} Weekly Schedule`, room);
        this.generateRoutineGrid(doc, routineSlots, timeSlots);
        this.generateFooter(doc);
      }

      return doc;
    } catch (error) {
      console.error('Error generating all rooms schedule PDF:', error);
      throw error;
    }
  }
}

module.exports = PDFRoutineService;
