import { Router } from 'express';
import { db } from './db';
import { customersOtp } from '../shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import { SmsService } from './sms-service';
import { WhatsAppService } from './whatsapp-service';
import { UniversalEmailService } from './universal-email-service';

const router = Router();

// Helper: Generate 6-digit OTP code
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; color: #2563eb; }
          .code-box { background: #eff6ff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 36px; font-weight: bold; color: #1e40af; letter-spacing: 8px; }
          .note { color: #666; font-size: 14px; margin-top: 20px; text-align: center; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Momtazchem</div>
            <h2>کد تایید ثبت نام</h2>
            <h3>Registration Verification Code</h3>
          </div>
          
          ${name ? `<p>مشتری گرامی ${name}، / Dear ${name},</p>` : '<p>مشتری گرامی، / Dear Customer,</p>'}
          
          <p>کد تایید شما برای تکمیل ثبت نام:</p>
          <p>Your verification code to complete registration:</p>
          
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          
          <div class="note">
            <p>⏰ این کد ظرف <strong>5 دقیقه</strong> منقضی خواهد شد.</p>
            <p>⏰ This code will expire in <strong>5 minutes</strong>.</p>
            <p>🔒 برای امنیت حساب خود، این کد را با کسی به اشتراک نگذارید.</p>
            <p>🔒 For your account security, do not share this code with anyone.</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Momtazchem. All rights reserved.</p>
            <p>اگر شما این درخواست را انجام نداده‌اید، این ایمیل را نادیده بگیرید.</p>
            <p>If you did not request this code, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await UniversalEmailService.sendEmail({
      categoryKey: 'customer_support',
      to: [email],
      subject: `کد تایید ثبت نام - Registration Code: ${code}`,
      html,
    });

    console.log(`📧 [OTP Email] Sent to ${email}:`, result);
    return result;
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
