// Test email sending functionality
import nodemailer from 'nodemailer';

async function testEmailSending() {
  try {
    // Using the SMTP configuration from the database
    const transporter = nodemailer.createTransport({
      host: 'smtppro.zoho.eu',
      port: 587,
      secure: false,
      auth: {
        user: 'info@momtazchem.com',
        pass: 'RkBTW6W7Qqt7'
      }
    });

    console.log('Testing SMTP connection...');
    
    // Test the connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');

    // Send a test email
    const result = await transporter.sendMail({
      from: '"شرکت ممتاز شیمی" <info@momtazchem.com>',
      to: 'sara.chemistry@example.com',
      subject: 'تست تغییر رمز عبور - شرکت ممتاز شیمی',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; direction: rtl;">
          <h1 style="color: #2563eb;">شرکت ممتاز شیمی</h1>
          <p>این یک ایمیل تست برای تغییر رمز عبور است.</p>
          <p>رمز عبور جدید: <strong>testpass123</strong></p>
          <p>با احترام، تیم پشتیبانی</p>
        </div>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
    
  } catch (error) {
    console.error('❌ Error testing email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
      response: error.response
    });
  }
}

testEmailSending();