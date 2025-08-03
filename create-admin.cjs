// Create admin account
const http = require('http');

async function makeRequest(url, method = 'POST', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const req = http.request(url, options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
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

async function createAdminAccount() {
  console.log('🔑 Creating admin account...');
  
  const userData = {
    name: 'System Admin',
    email: 'admin@bctroutine.com',
    password: 'admin123',
    role: 'admin'
  };
  
  try {
    const registerResponse = await makeRequest('http://localhost:7102/api/users', 'POST', userData);
    console.log('Register response:', registerResponse);
    
    if (registerResponse.user) {
      console.log('✅ Admin account created successfully!');
      console.log('Now you can use these credentials to log in:');
      console.log(`Email: ${userData.email}`);
      console.log(`Password: ${userData.password}`);
    } else {
      console.log('❌ Failed to create admin account.');
      console.log('Trying to login with these credentials in case the account already exists...');
      
      const loginResponse = await makeRequest('http://localhost:7102/api/auth/login', 'POST', {
        email: userData.email,
        password: userData.password
      });
      
      if (loginResponse.token) {
        console.log('✅ Login successful with provided credentials!');
      } else {
        console.log('❌ Login failed. Try these other common admin credentials:');
        console.log('1. Email: admin@bctroutine.com, Password: admin');
        console.log('2. Email: admin@example.com, Password: password');
      }
    }
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
  }
}

createAdminAccount();
