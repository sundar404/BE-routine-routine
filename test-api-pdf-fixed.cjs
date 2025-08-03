// Test PDF generation using API call (simulating backend)
const http = require('http');
const fs = require('fs');

async function makeRequest(url, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      options.headers['x-auth-token'] = token;
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request(url, options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.headers['content-type']?.includes('application/pdf')) {
          resolve(Buffer.from(responseData, 'binary'));
        } else {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testPDFAPI() {
  console.log('🧪 Testing PDF API with corrected mapping...');
  
  try {
    // Login
    const loginData = {
      email: 'admin@ioe.edu.np',
      password: 'admin123'
    };
    
    const loginResponse = await makeRequest('http://localhost:7102/api/auth/login', 'POST', loginData);
    
    if (!loginResponse.token) {
      console.log('❌ Login failed:', loginResponse);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginResponse.token;
    
    // Test PDF generation
    console.log('📄 Requesting PDF for BCT-5-AB...');
    
    // Correct endpoint: /api/routines/:programCode/:semester/:section/export-pdf
    const pdfBuffer = await makeRequest('http://localhost:7102/api/routines/BCT/5/AB/export-pdf', 'GET', null, token);
    
    if (Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 0) {
      // Save the PDF
      fs.writeFileSync('./test-api-pdf-fixed.pdf', pdfBuffer);
      console.log('✅ PDF generated successfully via API: test-api-pdf-fixed.pdf');
      console.log(`📊 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
      
      // Check PDF content
      const pdfContent = pdfBuffer.toString('binary');
      const hasValidPDF = pdfContent.startsWith('%PDF');
      console.log(`🔍 PDF validity: ${hasValidPDF ? '✅ Valid' : '❌ Invalid'}`);
      
    } else {
      console.log('❌ PDF generation failed or returned invalid data');
      console.log('Response:', pdfBuffer);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPDFAPI();
