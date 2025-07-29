// Quick test for email template processing
import { UniversalEmailService } from './server/universal-email-service.js';

async function testTemplate09() {
  console.log('🧪 Testing Template #09 processing...');
  
  try {
    const result = await UniversalEmailService.sendEmail({
      templateNumber: '#09',
      categoryKey: 'admin',
      to: ['test@example.com'],
      subject: 'Test Subject - Will be replaced',
      html: '<p>Test HTML - Will be replaced</p>',
      variables: {
        inquiry_number: 'TEST-12345',
        customer_name: 'Test Customer',
        company: 'Test Company',
        product_interest: 'fuel-additives',
        message: 'This is a test message',
        received_date: '2025-01-28',
        expected_response_time: '24 ساعت'
      }
    });
    
    console.log('✅ Email service result:', result);
  } catch (error) {
    console.error('❌ Email service error:', error);
  }
}

testTemplate09().catch(console.error);