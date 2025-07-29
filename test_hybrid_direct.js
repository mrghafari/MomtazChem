// Direct test of hybrid payment with logged customer
async function testHybridPayment() {
    console.log('Starting hybrid payment test...');
    
    // First login with existing customer
    const loginData = {
        email: "abas.abasi@example.com", 
        password: "password123"
    };
    
    const loginResponse = await fetch('http://localhost:5000/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login result:', loginResult);
    
    if (!loginResult.success) {
        console.log('Login failed, trying different credentials...');
        return;
    }
    
    // Extract cookies from response headers
    const cookies = loginResponse.headers.get('Set-Cookie');
    console.log('Login cookies:', cookies);
    
    // Now test hybrid payment
    const orderData = {
        cart: {"474": 1},
        paymentMethod: "wallet_partial", 
        totalAmount: 60000,
        walletAmountUsed: 20000,
        remainingAmount: 40000,
        customerName: "ABAS ABASI",
        phone: "09371234567",
        address: "Test Hybrid Payment Address",
        city: "کربلا",
        country: "Iraq"
    };
    
    const orderResponse = await fetch('http://localhost:5000/api/customers/orders', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': cookies || ''
        },
        body: JSON.stringify(orderData)
    });
    
    const orderResult = await orderResponse.json();
    console.log('Order result:', orderResult);
    console.log('Expected fields:');
    console.log('- requiresBankPayment:', orderResult.requiresBankPayment);
    console.log('- redirectUrl:', orderResult.redirectUrl);
    console.log('- walletAmountDeducted:', orderResult.walletAmountDeducted);
}

testHybridPayment().catch(console.error);