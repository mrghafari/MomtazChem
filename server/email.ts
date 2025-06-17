import nodemailer from 'nodemailer';
import { emailStorage } from './email-storage';

// Create transporter using database-stored SMTP settings
const createTransporter = async (categoryKey: string) => {
  const categorySettings = await emailStorage.getCategoryWithSettings(categoryKey);
  
  if (!categorySettings?.smtp) {
    throw new Error(`No SMTP configuration found for category: ${categoryKey}`);
  }

  const smtp = categorySettings.smtp;
  
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465 ? true : false,
    requireTLS: smtp.port === 587 ? true : false,
    auth: {
      user: smtp.username,
      pass: smtp.password,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 50,
    connectionTimeout: 20000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development',
    tls: {
      rejectUnauthorized: false
    }
  } as any);
};

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  productInterest: string;
  message: string;
}

export interface PasswordResetData {
  email: string;
  firstName?: string;
  lastName?: string;
  token: string;
}

export async function sendContactEmail(formData: ContactFormData): Promise<void> {
  try {
    const transporter = await createTransporter('admin');
    const categorySettings = await emailStorage.getCategoryWithSettings('admin');
    
    if (!categorySettings?.smtp || !categorySettings.recipients?.length) {
      throw new Error('No email configuration found for contact form');
    }

    const smtp = categorySettings.smtp;
    const recipients = categorySettings.recipients.filter(r => r.isActive);
    
    if (recipients.length === 0) {
      throw new Error('No active recipients found for contact form');
    }

    const recipientEmails = recipients.map(r => r.email).join(', ');
    
    // Filter out sender email from recipients to avoid "Invalid Recipients" error
    const filteredRecipients = recipients
      .filter(r => r.email.toLowerCase() !== smtp.fromEmail.toLowerCase())
      .map(r => r.email);
    
    // If no recipients remain after filtering, use the original list but change the from email
    const finalRecipients = filteredRecipients.length > 0 ? filteredRecipients.join(', ') : recipientEmails;
    const fromEmail = filteredRecipients.length > 0 ? smtp.fromEmail : `noreply@momtazchem.com`;
    
    const mailOptions = {
      from: `${smtp.fromName} <${fromEmail}>`,
      to: finalRecipients,
      subject: `New Contact Form Submission from ${formData.firstName} ${formData.lastName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Company:</strong> ${formData.company}</p>
        <p><strong>Product Interest:</strong> ${formData.productInterest}</p>
        <p><strong>Message:</strong></p>
        <p>${formData.message}</p>
      `,
      text: `
        New Contact Form Submission
        
        Name: ${formData.firstName} ${formData.lastName}
        Email: ${formData.email}
        Company: ${formData.company}
        Product Interest: ${formData.productInterest}
        
        Message:
        ${formData.message}
      `
    };

    // Send main email to admin
    console.log('Sending email to admin:', recipientEmails);
    const emailResult = await transporter.sendMail(mailOptions);
    console.log('Admin email sent successfully');

    // Send confirmation email to sender
    const confirmationOptions = {
      from: `${smtp.fromName} <${smtp.fromEmail}>`,
      to: formData.email,
      subject: `Thank you for contacting Momtaz Chemical - ${formData.firstName} ${formData.lastName}`,
      html: `
        <h2>Thank you for your inquiry!</h2>
        <p>Dear ${formData.firstName} ${formData.lastName},</p>
        <p>We have received your message and will get back to you within 24 hours.</p>
        
        <h3>Your Message Details:</h3>
        <p><strong>Company:</strong> ${formData.company}</p>
        <p><strong>Product Interest:</strong> ${formData.productInterest}</p>
        <p><strong>Message:</strong></p>
        <p>${formData.message}</p>
        
        <p>Best regards,<br>Momtaz Chemical Team</p>
      `,
      text: `
        Thank you for your inquiry!
        
        Dear ${formData.firstName} ${formData.lastName},
        
        We have received your message and will get back to you within 24 hours.
        
        Your Message Details:
        Company: ${formData.company}
        Product Interest: ${formData.productInterest}
        
        Message:
        ${formData.message}
        
        Best regards,
        Momtaz Chemical Team
      `
    };

    console.log('Sending confirmation email to:', formData.email);
    await transporter.sendMail(confirmationOptions);
    console.log('Confirmation email sent successfully');
    
    // Log both emails
    await emailStorage.logEmail({
      categoryId: categorySettings.category.id,
      toEmail: recipientEmails,
      fromEmail: smtp.fromEmail,
      subject: mailOptions.subject,
      status: 'sent',
      sentAt: new Date(),
    });

    await emailStorage.logEmail({
      categoryId: categorySettings.category.id,
      toEmail: formData.email,
      fromEmail: smtp.fromEmail,
      subject: confirmationOptions.subject,
      status: 'sent',
      sentAt: new Date(),
    });
    
  } catch (error) {
    console.error('Contact email error:', error);
    
    // Log the failed email attempt
    try {
      const categorySettings = await emailStorage.getCategoryWithSettings('admin');
      if (categorySettings) {
        await emailStorage.logEmail({
          categoryId: categorySettings.category.id,
          toEmail: formData.email,
          fromEmail: categorySettings.smtp?.fromEmail || '',
          subject: `Failed: New Contact Form Submission from ${formData.firstName} ${formData.lastName}`,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date(),
        });
      }
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }
    
    throw error;
  }
}

export interface ProductInquiryData {
  contactEmail: string;
  contactPhone?: string | null;
  company?: string | null;
  subject: string;
  message: string;
  type: string;
  priority: string;
  category: string;
  productName: string;
  inquiryNumber: string;
}

export async function sendProductInquiryEmail(inquiryData: ProductInquiryData): Promise<void> {
  try {
    const transporter = await createTransporter('product_inquiries');
    const categorySettings = await emailStorage.getCategoryWithSettings('product_inquiries');
    
    if (!categorySettings?.smtp || !categorySettings.recipients?.length) {
      throw new Error('No email configuration found for product inquiries');
    }

    const smtp = categorySettings.smtp;
    const recipients = categorySettings.recipients.filter(r => r.isActive);
    
    if (recipients.length === 0) {
      throw new Error('No active recipients found for product inquiries');
    }

    const recipientEmails = recipients.map(r => r.email).join(', ');
    const mailOptions = {
      from: `${smtp.fromName} <${smtp.fromEmail}>`,
      to: recipientEmails,
      subject: inquiryData.subject,
      html: `
        <h2>New Product Inquiry</h2>
        <p><strong>Inquiry Number:</strong> ${inquiryData.inquiryNumber}</p>
        <p><strong>Product:</strong> ${inquiryData.productName}</p>
        <p><strong>Contact Email:</strong> ${inquiryData.contactEmail}</p>
        <p><strong>Contact Phone:</strong> ${inquiryData.contactPhone || 'Not provided'}</p>
        <p><strong>Company:</strong> ${inquiryData.company || 'Not provided'}</p>
        <p><strong>Category:</strong> ${inquiryData.category}</p>
        <p><strong>Type:</strong> ${inquiryData.type}</p>
        <p><strong>Priority:</strong> ${inquiryData.priority}</p>
        <p><strong>Message:</strong></p>
        <p>${inquiryData.message}</p>
      `,
      text: `
        New Product Inquiry
        
        Inquiry Number: ${inquiryData.inquiryNumber}
        Product: ${inquiryData.productName}
        Contact Email: ${inquiryData.contactEmail}
        Contact Phone: ${inquiryData.contactPhone || 'Not provided'}
        Company: ${inquiryData.company || 'Not provided'}
        Category: ${inquiryData.category}
        Type: ${inquiryData.type}
        Priority: ${inquiryData.priority}
        
        Message:
        ${inquiryData.message}
      `
    };

    await transporter.sendMail(mailOptions);
    
    // Log the email with correct schema
    await emailStorage.logEmail({
      categoryId: categorySettings.category.id,
      toEmail: recipientEmails,
      fromEmail: smtp.fromEmail,
      subject: mailOptions.subject,
      status: 'sent',
      sentAt: new Date(),
    });
    
  } catch (error) {
    console.error('Product inquiry email error:', error);
    
    // Log the failed email attempt
    try {
      const categorySettings = await emailStorage.getCategoryWithSettings('product_inquiries');
      if (categorySettings) {
        await emailStorage.logEmail({
          categoryId: categorySettings.category.id,
          toEmail: inquiryData.contactEmail,
          fromEmail: categorySettings.smtp?.fromEmail || '',
          subject: `Failed: ${inquiryData.subject}`,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date(),
        });
      }
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }
    
    throw error;
  }
}
export async function sendPasswordResetEmail(resetData: PasswordResetData): Promise<void> {
  try {
    const transporter = await createTransporter('admin');
    const categorySettings = await emailStorage.getCategoryWithSettings('admin');
    
    if (!categorySettings?.smtp) {
      throw new Error('No email configuration found for password reset');
    }

    const smtp = categorySettings.smtp;
    const resetUrl = `${process.env.FRONTEND_URL || 'https://momtazchem.com'}/customer-reset-password?token=${resetData.token}`;
    
    const mailOptions = {
      from: `${smtp.fromName} <${smtp.fromEmail}>`,
      to: resetData.email,
      subject: 'بازیابی رمز عبور - Momtaz Chemical',
      html: `
        <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">بازیابی رمز عبور</h2>
          <p>سلام ${resetData.firstName ? `${resetData.firstName} ${resetData.lastName || ''}` : ''}،</p>
          
          <p>درخواست بازیابی رمز عبور برای حساب کاربری شما دریافت شد.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>برای تنظیم رمز عبور جدید، روی لینک زیر کلیک کنید:</strong></p>
            <a href="${resetUrl}" 
               style="display: inline-block; background: #2563eb; color: white; 
                      padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                      margin: 10px 0; font-weight: bold;">
              تنظیم رمز عبور جدید
            </a>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
              این لینک تا 1 ساعت معتبر است.
            </p>
          </div>
          
          <p>اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #666; font-size: 14px;">
            با تشکر،<br>
            تیم فنی مومتاز کمیکال<br>
            <a href="https://momtazchem.com" style="color: #2563eb;">momtazchem.com</a>
          </p>
        </div>
      `,
      text: `
بازیابی رمز عبور

سلام ${resetData.firstName ? `${resetData.firstName} ${resetData.lastName || ''}` : ''}،

درخواست بازیابی رمز عبور برای حساب کاربری شما دریافت شد.

برای تنظیم رمز عبور جدید، روی لینک زیر کلیک کنید:
${resetUrl}

این لینک تا 1 ساعت معتبر است.

اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.

با تشکر،
تیم فنی مومتاز کمیکال
momtazchem.com
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully to:', resetData.email);

    // Log email
    await emailStorage.logEmail({
      categoryId: categorySettings.category.id,
      toEmail: resetData.email,
      fromEmail: smtp.fromEmail,
      subject: mailOptions.subject,
      status: 'sent',
      sentAt: new Date(),
    });

  } catch (error) {
    console.error('Error sending password reset email:', error);
    
    // Log failed email
    try {
      const categorySettings = await emailStorage.getCategoryWithSettings('admin');
      if (categorySettings) {
        await emailStorage.logEmail({
          categoryId: categorySettings.category.id,
          toEmail: resetData.email,
          fromEmail: categorySettings.smtp?.fromEmail || '',
          subject: 'Password Reset Email (Failed)',
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date(),
        });
      }
    } catch (logError) {
      console.error('Failed to log password reset email error:', logError);
    }
    
    throw error;
  }
}
