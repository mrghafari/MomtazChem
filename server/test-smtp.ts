import nodemailer from 'nodemailer';

// Test SMTP connection for Zoho Mail
export async function testZohoSMTP(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.zoho.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      }
    });

    // Verify connection
    await transporter.verify();
    
    return {
      success: true,
      message: 'SMTP connection to Zoho Mail successful!'
    };
  } catch (error: any) {
    console.error('SMTP Test Error:', error);
    
    let errorMessage = 'SMTP connection failed';
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed - check username/password';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed - check host/port settings';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
}

// Send test email
export async function sendTestEmail(to: string = 'info@momtazchem.com'): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.zoho.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: to,
      subject: 'SMTP Test - Momtazchem Website',
      html: `
        <h2>SMTP Test Email</h2>
        <p>This is a test email to verify SMTP configuration for Momtazchem website.</p>
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        <p><strong>From:</strong> ${process.env.SMTP_USER}</p>
        <hr>
        <p><em>If you received this email, your SMTP configuration is working correctly!</em></p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: `Test email sent successfully! Message ID: ${info.messageId}`
    };
  } catch (error: any) {
    console.error('Test Email Error:', error);
    
    return {
      success: false,
      message: `Failed to send test email: ${error.message}`
    };
  }
}