// Test network connectivity untuk debugging
const testUrls = [
  'http://192.168.1.8/hadirinapp/test-connection.php',
  'http://192.168.1.8/hadirinapp/auth/api/login.php',
  'http://localhost/hadirinapp/test-connection.php'
];

async function testNetwork() {
  console.log('=== NETWORK CONNECTIVITY TEST ===\n');
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`✅ SUCCESS: ${response.status}`);
        console.log(`Response: ${data.substring(0, 100)}...\n`);
      } else {
        console.log(`❌ HTTP ERROR: ${response.status}\n`);
      }
      
    } catch (error) {
      console.log(`❌ NETWORK ERROR: ${error.message}\n`);
    }
  }
}

// Test login endpoint specifically
async function testLogin() {
  console.log('=== LOGIN ENDPOINT TEST ===\n');
  
  const loginUrl = 'http://192.168.1.8/hadirinapp/auth/api/login.php';
  
  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test123'
      })
    });
    
    const data = await response.json();
    console.log('Login test response:', data);
    
  } catch (error) {
    console.log('Login test error:', error.message);
  }
}

// Run tests
testNetwork().then(() => testLogin());