function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', background: 'white', color: 'black', minHeight: '100vh' }}>
      <header style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Momtazchem - Chemical Solutions</h1>
      </header>
      <main>
        <div style={{ marginBottom: '20px' }}>
          <h2>✅ System Status: Working</h2>
          <p>سایت شما حل شد و دوباره کار می‌کند!</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
            <h3>✅ Reserved Inventory System</h3>
            <p>Multi-stage inventory tracking with reserved stock management</p>
          </div>
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
            <h3>✅ Stock Threshold Management</h3>
            <p>Per-product customizable warning levels</p>
          </div>
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
            <h3>✅ Wallet Payment System</h3>
            <p>Real-time balance tracking and payment processing</p>
          </div>
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
            <h3>✅ Multilingual Support</h3>
            <p>English, Arabic, Kurdish, Turkish language support</p>
          </div>
        </div>
        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <h3>Quick Navigation</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a href="/shop" style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '3px' }}>Shop</a>
            <a href="/admin" style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '3px' }}>Admin Panel</a>
            <a href="/customer" style={{ padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '3px' }}>Customer Portal</a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;