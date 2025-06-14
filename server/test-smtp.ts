import nodemailer from 'nodemailer';

// Simple SMTP test function for debugging
export async function testSMTPConnection(config: {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  toEmail: string;
}) {
  try {
    console.log('Testing SMTP with config:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      username: config.username,
      password: config.password ? config.password.substring(0, 3) + '*'.repeat(config.password.length - 3) : 'undefined'
    });

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
      debug: true,
      logger: true,
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
      tls: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    // Send test email
    console.log('Sending test email...');
    const result = await transporter.sendMail({
      from: config.fromEmail,
      to: config.toEmail,
      subject: 'SMTP Test - ' + new Date().toISOString(),
      text: 'This is a test email to verify SMTP configuration.',
      html: '<p>This is a test email to verify SMTP configuration.</p>'
    });

    console.log('Test email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('SMTP test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code || 'UNKNOWN'
    };
  }
}

// Test with different authentication methods for Zoho
export async function testZohoSMTP(email: string, password: string, testEmail: string) {
  const configurations = [
    {
      name: 'Zoho EU with STARTTLS',
      host: 'smtppro.zoho.eu',
      port: 587,
      secure: false,
      username: email,
      password: password,
      fromEmail: email,
      toEmail: testEmail
    },
    {
      name: 'Zoho EU with SSL',
      host: 'smtppro.zoho.eu',
      port: 465,
      secure: true,
      username: email,
      password: password,
      fromEmail: email,
      toEmail: testEmail
    },
    {
      name: 'Zoho Global with STARTTLS',
      host: 'smtp.zoho.com',
      port: 587,
      secure: false,
      username: email,
      password: password,
      fromEmail: email,
      toEmail: testEmail
    }
  ];

  for (const config of configurations) {
    console.log(`\n--- Testing ${config.name} ---`);
    const result = await testSMTPConnection(config);
    
    if (result.success) {
      console.log(`✅ ${config.name} worked!`);
      return { success: true, config, result };
    } else {
      console.log(`❌ ${config.name} failed: ${result.error}`);
    }
  }

  return { success: false, message: 'All configurations failed' };
}

// Simple test email function for admin interface
export async function sendTestEmail(email: string) {
  try {
    // Default configuration - can be made configurable later
    const config = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      username: process.env.SMTP_USERNAME || '',
      password: process.env.SMTP_PASSWORD || '',
      fromEmail: process.env.SMTP_FROM || process.env.SMTP_USERNAME || '',
      toEmail: email
    };

    if (!config.username || !config.password) {
      return {
        success: false,
        error: 'SMTP credentials not configured. Please set SMTP_USERNAME and SMTP_PASSWORD environment variables.'
      };
    }

    return await testSMTPConnection(config);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}