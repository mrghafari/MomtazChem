const https = require('https');

async function testWalletOrder() {
  // Step 1: Login customer
  const loginData = JSON.stringify({
    email: 'oilstar@hotmail.com',
    password: 'petroshimi'
  });

  const loginOptions = {
    hostname: '861926f6-85c5-4e93-bb9b-7e1a3d8bd878-00-2majci4octycm.picard.replit.dev',
    path: '/api/customers/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  return new Promise((resolve, reject) => {
    const loginReq = https.request(loginOptions, (loginRes) => {
      let loginResponseData = '';
      
      loginRes.on('data', (chunk) => {
        loginResponseData += chunk;
      });
      
      loginRes.on('end', () => {
        console.log('Login response:', loginResponseData);
        
        // Extract session cookie
        const cookies = loginRes.headers['set-cookie'];
        console.log('Login cookies:', cookies);
        
        if (!cookies) {
          reject('No cookies received from login');
          return;
        }
        
        const sessionCookie = cookies.find(cookie => cookie.startsWith('connect.sid='));
        
        if (!sessionCookie) {
          reject('No session cookie found');
          return;
        }
        
        // Step 2: Place order with wallet payment
        const orderData = JSON.stringify({
          paymentMethod: 'wallet_full',
          walletAmountUsed: 100,
          remainingAmount: 0,
          totalAmount: 100,
          customerName: 'ABAS ABASI',
          phone: '09124955173',
          address: 'Test Address',
          city: 'Tehran',
          country: 'Iran',
          cart: {"383": 1}
        });

        const orderOptions = {
          hostname: '861926f6-85c5-4e93-bb9b-7e1a3d8bd878-00-2majci4octycm.picard.replit.dev',
          path: '/api/customers/orders',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(orderData),
            'Cookie': sessionCookie.split(';')[0] // Just the session part
          }
        };

        const orderReq = https.request(orderOptions, (orderRes) => {
          let orderResponseData = '';
          
          orderRes.on('data', (chunk) => {
            orderResponseData += chunk;
          });
          
          orderRes.on('end', () => {
            console.log('Order response status:', orderRes.statusCode);
            console.log('Order response:', orderResponseData);
            resolve(orderResponseData);
          });
        });

        orderReq.on('error', (err) => {
          console.error('Order request error:', err);
          reject(err);
        });

        orderReq.write(orderData);
        orderReq.end();
      });
    });

    loginReq.on('error', (err) => {
      console.error('Login request error:', err);
      reject(err);
    });

    loginReq.write(loginData);
    loginReq.end();
  });
}

testWalletOrder()
  .then(result => {
    console.log('Test completed successfully');
  })
  .catch(error => {
    console.error('Test failed:', error);
  });