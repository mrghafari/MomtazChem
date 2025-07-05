#!/usr/bin/env node

// Comprehensive System Health Check for Momtazchem Platform
import http from 'http';

const endpoints = [
  { path: '/api/products', name: 'Products API' },
  { path: '/api/content', name: 'Content Management API' },
  { path: '/api/shop/products', name: 'Shop Products API' },
  { path: '/api/crm/customers', name: 'CRM Customers API' },
  { path: '/api/email/categories', name: 'Email Categories API' },
  { path: '/api/seo/sitemap-data', name: 'SEO Sitemap API' },
  { path: '/api/admin/me', name: 'Admin Authentication API' },
  { path: '/api/customers/me', name: 'Customer Authentication API' },
];

const adminEndpoints = [
  { path: '/api/admin/analytics/dashboard', name: 'Admin Analytics Dashboard' },
  { path: '/api/admin/backup/status', name: 'Database Backup Status' },
  { path: '/api/barcode/stats', name: 'Barcode System Stats' },
];

async function checkEndpoint(endpoint) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:5000${endpoint.path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            name: endpoint.name,
            status: res.statusCode,
            success: res.statusCode < 400,
            dataLength: data.length,
            hasData: parsed && (parsed.data || parsed.success || Array.isArray(parsed))
          });
        } catch (e) {
          resolve({
            name: endpoint.name,
            status: res.statusCode,
            success: false,
            error: 'Invalid JSON response'
          });
        }
      });
    });
    
    req.on('error', (err) => {
      resolve({
        name: endpoint.name,
        status: 'ERROR',
        success: false,
        error: err.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        name: endpoint.name,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function runHealthCheck() {
  console.log('🔍 Momtazchem Platform Health Check\n');
  console.log('=' * 50);
  
  // Test basic endpoints
  console.log('\n📊 Core API Endpoints:');
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint);
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status} ${result.error || ''}`);
  }
  
  // Test admin endpoints
  console.log('\n🔐 Admin Endpoints:');
  for (const endpoint of adminEndpoints) {
    const result = await checkEndpoint(endpoint);
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status} ${result.error || ''}`);
  }
  
  console.log('\n🌐 Frontend Health Check:');
  const frontendResult = await checkEndpoint({ path: '/', name: 'Frontend Homepage' });
  const frontendStatus = frontendResult.success && frontendResult.dataLength > 1000 ? '✅' : '❌';
  console.log(`${frontendStatus} Frontend Homepage: ${frontendResult.status} (${frontendResult.dataLength} bytes)`);
  
  console.log('\n' + '=' * 50);
  console.log('Health check completed.');
}

runHealthCheck().catch(console.error);