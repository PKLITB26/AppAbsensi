// Test login API
const testLogin = async () => {
  const url = 'http://localhost/hadirinapp/auth/api/login.php';
  
  try {
    console.log('Testing login endpoint...');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'test123' 
      }),
    });
    
    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);
    
    // Test with empty credentials
    const response2 = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: '', 
        password: '' 
      }),
    });
    
    const text2 = await response2.text();
    console.log('\nEmpty credentials test:');
    console.log('Status:', response2.status);
    console.log('Response:', text2);
    
  } catch (error) {
    console.log('Error:', error.message);
  }
};

testLogin();