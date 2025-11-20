import { Router } from 'express';
import { db } from './db';
import { customersOtp, crmCustomers } from '../shared/schema';
import { emailTemplates } from '../shared/customer-schema';
import { eq, and, gt } from 'drizzle-orm';
import { SmsService } from './sms-service';
import { WhatsAppService } from './whatsapp-service';
import nodemailer from 'nodemailer';
import { EmailStorage } from './email-storage';
import bcrypt from 'bcryptjs';

const router = Router();
const emailStorage = new EmailStorage();

// Helper: Generate 4-digit OTP code
function generateOtpCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Helper: Send OTP via WhatsApp
async function sendOtpWhatsApp(phone: string, code: string): Promise<boolean> {
  try {
    const whatsappService = new WhatsAppService({
      isEnabled: true,
      provider: 'ultramsg', // or your configured provider
    });

    const message = `کد تایید شما: ${code}\nYour verification code: ${code}\n\nاین کد ظرف 5 دقیقه منقضی خواهد شد.\nThis code expires in 5 minutes.`;

    const result = await whatsappService.sendMessage({
      to: phone,
      message,
    });

    console.log(`📱 [OTP WhatsApp] Sent to ${phone}:`, result.success);
    return result.success;
  } catch (error) {
    console.error('❌ [OTP WhatsApp] Error:', error);
    return false;
  }
}

// Helper: Send OTP via SMS
async function sendOtpSms(phone: string, code: string): Promise<boolean> {
  try {
    const smsService = new SmsService({
      isEnabled: true,
      provider: 'infobip', // or your configured provider
      codeLength: 6,
      codeExpiry: 300,
      maxAttempts: 3,
      rateLimitMinutes: 5,
    });

    const message = `کد تایید: ${code}\nVerification code: ${code}\nExpires in 5 min`;

    const result = await smsService.sendSms({
      to: phone,
      message,
      code,
    });

    console.log(`📱 [OTP SMS] Sent to ${phone}:`, result.success);
    return result.success;
  } catch (error) {
    console.error('❌ [OTP SMS] Error:', error);
    return false;
  }
}

// Helper: Send OTP via Email
async function sendOtpEmail(email: string, code: string, name?: string): Promise<boolean> {
  try {
    // Get SMTP settings for OTP from database
    const smtpSetting = await emailStorage.getOtpSmtpSetting();
    
    if (!smtpSetting) {
      console.error('❌ [OTP Email] No SMTP settings configured for OTP');
      return false;
    }

    // Load OTP email template from database
    const template = await db.query.emailTemplates.findFirst({
      where: and(
        eq(emailTemplates.category, 'authentication'),
        eq(emailTemplates.isActive, true)
      ),
    });

    if (!template) {
      console.error('❌ [OTP Email] No OTP email template found in database');
      return false;
    }

    // Simple template variable replacement
    const variables = {
      code,
      customerName: name || '',
      year: new Date().getFullYear().toString(),
    };

    let html = template.htmlContent;
    let subject = template.subject;

    // Replace all variables in format {{variableName}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    // Handle conditional blocks {{#if customerName}}...{{else}}...{{/if}}
    if (name) {
      html = html.replace(/{{#if customerName}}(.*?){{else}}.*?{{\/if}}/gs, '$1');
    } else {
      html = html.replace(/{{#if customerName}}.*?{{else}}(.*?){{\/if}}/gs, '$1');
    }

    // Create SMTP transporter with database settings
    const transporter = nodemailer.createTransport({
      host: smtpSetting.host,
      port: smtpSetting.port,
      secure: smtpSetting.secure,
      auth: {
        user: smtpSetting.username,
        pass: smtpSetting.password,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"${smtpSetting.fromName}" <${smtpSetting.fromEmail}>`,
      to: email,
      subject,
      html,
    });

    console.log(`📧 [OTP Email] Sent to ${email} using ${smtpSetting.fromEmail}:`, info.messageId);
    return true;
  } catch (error) {
    console.error('❌ [OTP Email] Error:', error);
    return false;
  }
}

// POST /api/customers/send-otp
router.post('/api/customers/send-otp', async (req, res) => {
  try {
    const { phone, email, registrationData } = req.body;

    if (!phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Phone and email are required',
      });
    }

    // Check rate limiting (max 1 OTP every 1 minute per phone/email)
    const recentOtp = await db.query.customersOtp.findFirst({
      where: and(
        eq(customersOtp.phone, phone),
        eq(customersOtp.email, email),
        gt(customersOtp.lastSentAt, new Date(Date.now() - 60000)) // Last 1 minute
      ),
    });

    if (recentOtp) {
      const secondsRemaining = Math.ceil((60000 - (Date.now() - new Date(recentOtp.lastSentAt).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${secondsRemaining} seconds before requesting a new code`,
        retryAfter: secondsRemaining,
      });
    }

    // Generate OTP code
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to database
    const [otpRecord] = await db.insert(customersOtp).values({
      phone,
      email,
      code,
      expiresAt,
      attempts: 0,
      verified: false,
      lastSentAt: new Date(),
      registrationData: registrationData || null,
    }).returning();

    console.log(`🔐 [OTP] Generated code for ${phone}/${email}: ${code}`);

    // Send OTP simultaneously to WhatsApp, SMS, and Email
    const sendPromises = [
      sendOtpWhatsApp(phone, code),
      sendOtpSms(phone, code),
      sendOtpEmail(email, code, registrationData?.firstName),
    ];

    const results = await Promise.allSettled(sendPromises);
    
    const whatsappSuccess = results[0].status === 'fulfilled' && results[0].value;
    const smsSuccess = results[1].status === 'fulfilled' && results[1].value;
    const emailSuccess = results[2].status === 'fulfilled' && results[2].value;

    console.log(`📤 [OTP] Delivery results - WhatsApp: ${whatsappSuccess}, SMS: ${smsSuccess}, Email: ${emailSuccess}`);

    // At least one channel must succeed
    if (!whatsappSuccess && !smsSuccess && !emailSuccess) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
      });
    }

    return res.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresAt: otpRecord.expiresAt,
      sentVia: {
        whatsapp: whatsappSuccess,
        sms: smsSuccess,
        email: emailSuccess,
      },
    });

  } catch (error) {
    console.error('❌ [OTP] Send error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification code',
    });
  }
});

// POST /api/customers/verify-otp
router.post('/api/customers/verify-otp', async (req, res) => {
  try {
    const { phone, email, code } = req.body;

    if (!phone || !email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone, email, and code are required',
      });
    }

    // Find OTP record
    const otpRecord = await db.query.customersOtp.findFirst({
      where: and(
        eq(customersOtp.phone, phone),
        eq(customersOtp.email, email),
        eq(customersOtp.verified, false)
      ),
      orderBy: (customersOtp, { desc }) => [desc(customersOtp.createdAt)],
    });

    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: 'No verification code found for this phone/email',
      });
    }

    // Check if expired
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
        expired: true,
      });
    }

    // Check max attempts
    if (otpRecord.attempts >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new code.',
        maxAttemptsExceeded: true,
      });
    }

    // Verify code
    if (otpRecord.code !== code) {
      // Increment attempts
      await db.update(customersOtp)
        .set({ attempts: otpRecord.attempts + 1 })
        .where(eq(customersOtp.id, otpRecord.id));

      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
        attemptsRemaining: 3 - (otpRecord.attempts + 1),
      });
    }

    // Mark as verified
    await db.update(customersOtp)
      .set({ verified: true })
      .where(eq(customersOtp.id, otpRecord.id));

    console.log(`✅ [OTP] Verified successfully for ${phone}/${email}`);

    // Create customer account from registrationData
    if (otpRecord.registrationData) {
      const regData = otpRecord.registrationData as any;
      
      // Check if customer already exists
      const existingCustomer = await db.query.crmCustomers.findFirst({
        where: eq(crmCustomers.email, email),
      });

      if (existingCustomer) {
        return res.json({
          success: true,
          message: 'Verification successful',
          customer: existingCustomer,
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(regData.password, 10);

      // Create customer in CRM
      const [newCustomer] = await db.insert(crmCustomers).values({
        email: regData.email,
        passwordHash: hashedPassword,
        firstName: regData.firstName,
        lastName: regData.lastName,
        phone: regData.phone,
        alternatePhone: regData.alternatePhone || null,
        company: regData.company || null,
        country: regData.country,
        province: regData.province,
        cityRegion: regData.city,
        address: regData.address,
        secondaryAddress: regData.secondaryAddress || null,
        postalCode: regData.postalCode || null,
        industry: regData.industry || null,
        businessType: regData.businessType || 'end_user',
        companySize: regData.companySize || null,
        communicationPreference: regData.communicationPreference || 'email',
        preferredLanguage: regData.preferredLanguage || 'en',
        marketingConsent: regData.marketingConsent || false,
        customerType: 'retail',
        customerSource: 'website',
        customerStatus: 'active',
      }).returning();

      console.log(`✅ [OTP] Customer account created for ${email}`);

      return res.json({
        success: true,
        message: 'Verification successful',
        customer: newCustomer,
      });
    }

    return res.json({
      success: true,
      message: 'Verification successful',
      registrationData: otpRecord.registrationData,
    });

  } catch (error) {
    console.error('❌ [OTP] Verify error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify code',
    });
  }
});

// POST /api/customers/resend-otp
router.post('/api/customers/resend-otp', async (req, res) => {
  try {
    const { phone, email } = req.body;

    if (!phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Phone and email are required',
      });
    }

    // Check rate limiting (max 1 OTP every 1 minute)
    const recentOtp = await db.query.customersOtp.findFirst({
      where: and(
        eq(customersOtp.phone, phone),
        eq(customersOtp.email, email),
        gt(customersOtp.lastSentAt, new Date(Date.now() - 60000))
      ),
      orderBy: (customersOtp, { desc }) => [desc(customersOtp.lastSentAt)],
    });

    if (recentOtp) {
      const secondsRemaining = Math.ceil((60000 - (Date.now() - new Date(recentOtp.lastSentAt).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${secondsRemaining} seconds before requesting a new code`,
        retryAfter: secondsRemaining,
      });
    }

    // Get the last OTP record for registration data
    const lastOtp = await db.query.customersOtp.findFirst({
      where: and(
        eq(customersOtp.phone, phone),
        eq(customersOtp.email, email)
      ),
      orderBy: (customersOtp, { desc }) => [desc(customersOtp.createdAt)],
    });

    // Generate new OTP
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save new OTP
    const [otpRecord] = await db.insert(customersOtp).values({
      phone,
      email,
      code,
      expiresAt,
      attempts: 0,
      verified: false,
      lastSentAt: new Date(),
      registrationData: lastOtp?.registrationData || null,
    }).returning();

    console.log(`🔄 [OTP] Resent code for ${phone}/${email}: ${code}`);

    // Send OTP simultaneously to all channels
    const sendPromises = [
      sendOtpWhatsApp(phone, code),
      sendOtpSms(phone, code),
      sendOtpEmail(email, code, (lastOtp?.registrationData as any)?.firstName),
    ];

    const results = await Promise.allSettled(sendPromises);
    
    const whatsappSuccess = results[0].status === 'fulfilled' && results[0].value;
    const smsSuccess = results[1].status === 'fulfilled' && results[1].value;
    const emailSuccess = results[2].status === 'fulfilled' && results[2].value;

    console.log(`📤 [OTP Resend] Delivery results - WhatsApp: ${whatsappSuccess}, SMS: ${smsSuccess}, Email: ${emailSuccess}`);

    if (!whatsappSuccess && !smsSuccess && !emailSuccess) {
      return res.status(500).json({
        success: false,
        message: 'Failed to resend OTP. Please try again.',
      });
    }

    return res.json({
      success: true,
      message: 'New verification code sent successfully',
      expiresAt: otpRecord.expiresAt,
      sentVia: {
        whatsapp: whatsappSuccess,
        sms: smsSuccess,
        email: emailSuccess,
      },
    });

  } catch (error) {
    console.error('❌ [OTP] Resend error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend verification code',
    });
  }
});

export default router;
