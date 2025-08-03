// Test border lines and merged class display for slots 6,7,8
const PDFDocument = require('pdfkit');
const fs = require('fs');

console.log('🧪 Testing Border Lines and Merged Class Display...');

// Create a simple test PDF to verify border line functionality
const doc = new PDFDocument({ size: [842, 1400], layout: 'portrait' });
const stream = fs.createWriteStream('./test_border_lines.pdf');
doc.pipe(stream);

// Test cell dimensions
const x = 50;
const y = 50;
const width = 200;
const height = 120;

// Simulate merged class content with border separators
const testContent = `Computer Organization & Architecture [P]
Dr. Smith
Room 301
──────
Instrumentation II [P]
Prof. Johnson
Room 205`;

console.log('📝 Test content:');
console.log(testContent);

// Function to draw cell with border lines (simplified version of our implementation)
function drawTestCell(doc, x, y, width, height, text) {
  // Draw cell background with border
  doc.rect(x, y, width, height)
     .lineWidth(0.5)
     .fillAndStroke('#ffffff', '#c0c0c0');
  
  if (text && text.trim()) {
    const lines = text.split('\n').filter(line => line.trim());
    const fontSize = 8;
    const lineHeight = fontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    
    // Calculate vertical center position
    const cellCenterY = y + (height / 2);
    const textStartY = cellCenterY - (totalTextHeight / 2) + (lineHeight * 0.75);
    
    doc.fontSize(fontSize)
       .font('Helvetica')
       .fillColor('#333333');
    
    // Draw each line with border line handling
    lines.forEach((line, index) => {
      if (line.trim()) {
        const lineY = textStartY + (index * lineHeight);
        
        // Special handling for separator lines
        if (line.trim() === '──────') {
          // Draw actual border line instead of text
          const borderY = lineY + (fontSize * 0.3);
          const borderMargin = 10;
          
          doc.save();
          doc.strokeColor('#888888')
             .lineWidth(0.8)
             .moveTo(x + borderMargin, borderY)
             .lineTo(x + width - borderMargin, borderY)
             .stroke();
          doc.restore();
          
          doc.fillColor('#333333');
        } else {
          // Draw regular text
          doc.text(line.trim(), x + 6, lineY, {
            width: width - 12,
            align: 'center',
            baseline: 'top'
          });
        }
      }
    });
  }
}

// Draw test title
doc.fontSize(14)
   .font('Helvetica-Bold')
   .text('Border Lines Test for Slots 6,7,8 Merged Classes', 50, 20);

// Draw test cell
console.log('🎨 Drawing test cell with border lines...');
drawTestCell(doc, x, y, width, height, testContent);

// Add labels
doc.fontSize(10)
   .font('Helvetica')
   .text('Test Cell: Merged Practical Classes', x, y + height + 10)
   .text('- White background (no color)', x, y + height + 25)
   .text('- Border lines instead of text separators', x, y + height + 40)
   .text('- Class information clearly displayed', x, y + height + 55);

// Draw another example showing slots 6,7,8 scenario
const x2 = 300;
const spanningContent = `Computer Organization & Architecture [P]
Dr. Smith, Room 301
──────
Instrumentation II [P]  
Prof. Johnson, Room 205`;

doc.fontSize(12)
   .font('Helvetica-Bold')
   .text('Slots 6,7,8 Spanning Example', x2, y - 20);

drawTestCell(doc, x2, y, width, height, spanningContent);

console.log('✅ Test PDF content created');

// Finalize the PDF
doc.end();

stream.on('finish', () => {
  console.log('💾 Test PDF saved as test_border_lines.pdf');
  console.log('🔍 Check the PDF to verify:');
  console.log('  ✓ Border lines instead of ──── text');
  console.log('  ✓ White background (no colored backgrounds)');
  console.log('  ✓ Clear class information display');
  console.log('🏁 Border lines test completed');
});

stream.on('error', (error) => {
  console.error('❌ Error creating test PDF:', error);
});
