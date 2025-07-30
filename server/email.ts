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
    // Force UTF-8 encoding to prevent character corruption
    defaults: {
      encoding: 'utf-8',
      charset: 'utf-8'
    },
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
  categoryEmail?: string; // Optional category-specific email for intelligent routing
}

export interface PasswordResetData {
  email: string;
  firstName?: string;
  lastName?: string;
  token: string;
}

// Map product interest to email category
function mapProductInterestToCategory(productInterest: string): string {
  const mapping: Record<string, string> = {
    'water-treatment': 'water-treatment',
    'fuel-additives': 'fuel-additives',
    'paint-solvents': 'paint-thinner',

    'agricultural-fertilizers': 'agricultural-fertilizers',
    'industrial-chemicals': 'admin',
    'paint-thinner': 'paint-thinner',
    'technical-equipment': 'admin',
    'commercial-goods': 'admin',
    'custom-solutions': 'orders', // Custom solutions go to Sales department
  };
  
  return mapping[productInterest] || 'admin'; // Default to admin if no match
}

// Helper function to send email with specific settings
async function sendWithSettings(formData: ContactFormData, categorySettings: any, transporter: any, originalCategoryKey: string): Promise<void> {
  const smtp = categorySettings.smtp;
  const recipients = categorySettings.recipients.filter((r: any) => r.isActive);
  
  if (recipients.length === 0) {
    throw new Error('No active recipients found for email category');
  }

  // Separate recipients by type and filter out sender email from all lists
  const toRecipients = recipients
    .filter((r: any) => (!r.recipientType || r.recipientType === 'to') && r.email.toLowerCase() !== smtp.fromEmail.toLowerCase())
    .map((r: any) => r.email);
  
  const ccRecipients = recipients
    .filter((r: any) => r.recipientType === 'cc' && r.email.toLowerCase() !== smtp.fromEmail.toLowerCase())
    .map((r: any) => r.email);
  
  const bccRecipients = recipients
    .filter((r: any) => r.recipientType === 'bcc' && r.email.toLowerCase() !== smtp.fromEmail.toLowerCase())
    .map((r: any) => r.email);
  
  // Add smart CC for monitoring (info@momtazchem.com) if not already present
  // This is now managed by Universal Email Service configuration
  const monitoringEmail = 'info@momtazchem.com';
  const isMonitoringEmailPresent = 
    smtp.fromEmail.toLowerCase() === monitoringEmail.toLowerCase() ||
    toRecipients.some((email: string) => email.toLowerCase() === monitoringEmail.toLowerCase()) ||
    ccRecipients.some((email: string) => email.toLowerCase() === monitoringEmail.toLowerCase()) ||
    bccRecipients.some((email: string) => email.toLowerCase() === monitoringEmail.toLowerCase());
  
  if (!isMonitoringEmailPresent) {
    ccRecipients.push(monitoringEmail);
  }
  
  // Check if we have any recipients after filtering
  if (toRecipients.length === 0 && ccRecipients.length === 0 && bccRecipients.length === 0) {
    console.log(`Skipping email for ${categorySettings.category.categoryName} - no valid recipients after filtering`);
    return;
  }
  
  const fromEmail = smtp.fromEmail;
  
  console.log(`Email distribution - TO: ${toRecipients.join(', ')}, CC: ${ccRecipients.join(', ')}, BCC: ${bccRecipients.join(', ')}`);
  
  const mailOptions = {
    from: `${smtp.fromName} <${fromEmail}>`,
    to: toRecipients.length > 0 ? toRecipients.join(', ') : undefined,
    cc: ccRecipients.length > 0 ? ccRecipients.join(', ') : undefined,
    bcc: bccRecipients.length > 0 ? bccRecipients.join(', ') : undefined,
    subject: `New Contact Form Submission from ${formData.firstName} ${formData.lastName} [${categorySettings.category.categoryName}]`,
    encoding: 'utf-8',
    charset: 'utf-8',
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Category:</strong> ${categorySettings.category.categoryName}</p>
      <p><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      <p><strong>Company:</strong> ${formData.company}</p>
      <p><strong>Product Interest:</strong> ${formData.productInterest}</p>
      <p><strong>Message:</strong></p>
      <p>${formData.message}</p>
    `,
    text: `
      New Contact Form Submission
      
      Category: ${categorySettings.category.categoryName}
      Name: ${formData.firstName} ${formData.lastName}
      Email: ${formData.email}
      Company: ${formData.company}
      Product Interest: ${formData.productInterest}
      
      Message:
      ${formData.message}
    `
  };

  // Send main email to category-specific recipients
  console.log(`Sending email to ${categorySettings.category.categoryName}`);
  await transporter.sendMail(mailOptions);
  console.log(`Email sent successfully to ${categorySettings.category.categoryName}`);

  // Send confirmation email to sender - NO CC to avoid duplicate recipient errors
  // Skip confirmation email if sender email is same as from email
  if (formData.email.toLowerCase() === smtp.fromEmail.toLowerCase()) {
    console.log('Skipping confirmation email - sender is same as from email');
    return;
  }
  
  const confirmationOptions = {
    from: `${smtp.fromName} <${smtp.fromEmail}>`,
    to: formData.email,
    subject: `Thank you for contacting Momtaz Chemical - ${formData.firstName} ${formData.lastName}`,
    encoding: 'utf-8',
    charset: 'utf-8',
    html: `
      <h2>Thank you for your inquiry!</h2>
      <p>Dear ${formData.firstName} ${formData.lastName},</p>
      <p>We have received your message regarding <strong>${formData.productInterest}</strong> and it has been forwarded to our <strong>${categorySettings.category.categoryName}</strong>.</p>
      <p>We will get back to you within 24 hours.</p>
      
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
      
      We have received your message regarding ${formData.productInterest} and it has been forwarded to our ${categorySettings.category.categoryName}.
      We will get back to you within 24 hours.
      
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
    toEmail: `TO: ${toRecipients.join(', ')} | CC: ${ccRecipients.join(', ')} | BCC: ${bccRecipients.join(', ')}`,
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
}

// Send email using category email assignment
async function sendWithCategoryEmailAssignment(formData: ContactFormData): Promise<void> {
  try {
    // Use admin category for SMTP settings but send to category-specific email
    const transporter = await createTransporter('admin');
    const adminSettings = await emailStorage.getCategoryWithSettings('admin');
    
    if (!adminSettings?.smtp) {
      throw new Error('No admin SMTP configuration found for category email assignment');
    }

    const mailOptions = {
      from: adminSettings.smtp.fromEmail,
      to: formData.categoryEmail,
      cc: ['info@momtazchem.com'], // Always CC to main company email (now managed by Universal Email Service)
      subject: `درخواست جدید از فرم تماس - ${formData.firstName} ${formData.lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2>درخواست جدید از فرم تماس</h2>
          <p><strong>نام:</strong> ${formData.firstName} ${formData.lastName}</p>
          <p><strong>ایمیل:</strong> ${formData.email}</p>
          <p><strong>شرکت:</strong> ${formData.company || 'نامشخص'}</p>
          <p><strong>علاقه‌مندی محصول:</strong> ${formData.productInterest}</p>
          <p><strong>پیام:</strong></p>
          <div style="border: 1px solid #ddd; padding: 10px; background-color: #f9f9f9;">
            ${formData.message.replace(/\n/g, '<br>')}
          </div>
          <hr>
          <p style="font-size: 12px; color: #666;">
            این ایمیل به صورت خودکار بر اساس دسته‌بندی محصول مورد علاقه مشتری ارسال شده است.
          </p>
        </div>
      `,
      text: `
درخواست جدید از فرم تماس

نام: ${formData.firstName} ${formData.lastName}
ایمیل: ${formData.email}
شرکت: ${formData.company || 'نامشخص'}
علاقه‌مندی محصول: ${formData.productInterest}

پیام:
${formData.message}

---
این ایمیل به صورت خودکار بر اساس دسته‌بندی محصول مورد علاقه مشتری ارسال شده است.
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Contact form email sent successfully to category-specific email: ${formData.categoryEmail}`);

    // Log the email
    await emailStorage.logEmail({
      categoryId: adminSettings.category.id,
      toEmail: formData.categoryEmail!,
      fromEmail: adminSettings.smtp.fromEmail,
      subject: mailOptions.subject,
      status: 'sent',
      sentAt: new Date(),
    });

  } catch (error) {
    console.error('Category email assignment error:', error);
    throw error;
  }
}

export async function sendContactEmail(formData: ContactFormData): Promise<void> {
  try {
    // Check if there's a specific category email assignment
    if (formData.categoryEmail) {
      console.log(`Using category-specific email assignment: ${formData.categoryEmail}`);
      // Send directly to the assigned category email
      return await sendWithCategoryEmailAssignment(formData);
    }
    
    // Fallback to the original category-based routing system
    const categoryKey = mapProductInterestToCategory(formData.productInterest);
    console.log(`Contact form for '${formData.productInterest}' routed to category: ${categoryKey}`);
    
    const transporter = await createTransporter(categoryKey);
    const categorySettings = await emailStorage.getCategoryWithSettings(categoryKey);
    
    if (!categorySettings?.smtp || !categorySettings.recipients?.length) {
      // Fallback to admin category if specific category is not configured
      console.log(`Category '${categoryKey}' not configured, falling back to admin`);
      const fallbackTransporter = await createTransporter('admin');
      const fallbackSettings = await emailStorage.getCategoryWithSettings('admin');
      
      if (!fallbackSettings?.smtp || !fallbackSettings.recipients?.length) {
        throw new Error('No email configuration found for contact form and admin fallback');
      }
      
      // Use fallback settings
      return await sendWithSettings(formData, fallbackSettings, fallbackTransporter, categoryKey);
    }

    // Use the configured category settings
    return await sendWithSettings(formData, categorySettings, transporter, categoryKey);
    
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
    // Determine the correct category for email routing based on inquiry category
    let emailCategory = 'product_inquiries'; // Default for backward compatibility
    
    if (inquiryData.category) {
      // Map inquiry category to email category key
      const categoryMap: { [key: string]: string } = {
        'fuel-additives': 'fuel-additives',
        'water-treatment': 'water-treatment', 
        'paint-solvents': 'paint-solvents',

        'agricultural-fertilizers': 'agricultural-fertilizers',
        'industrial-chemicals': 'industrial-chemicals',
        'paint-thinner': 'paint-thinner',
        'technical-equipment': 'technical-equipment',
        'commercial-goods': 'commercial-goods',
        'general': 'product_inquiries',
        'support': 'support'
      };
      
      emailCategory = categoryMap[inquiryData.category] || 'product_inquiries';
      console.log(`📧 Product inquiry routing: inquiry category '${inquiryData.category}' → email category '${emailCategory}'`);
    }

    // Try to get category-specific settings, fallback to product_inquiries, then admin
    let transporter, categorySettings;
    
    try {
      transporter = await createTransporter(emailCategory);
      categorySettings = await emailStorage.getCategoryWithSettings(emailCategory);
      
      if (!categorySettings?.smtp || !categorySettings.recipients?.length) {
        throw new Error(`No email configuration found for category: ${emailCategory}`);
      }
      console.log(`✅ Using SMTP settings for category '${emailCategory}': ${categorySettings.smtp.fromEmail}`);
    } catch (categoryError) {
      console.log(`❌ Category '${emailCategory}' not configured, falling back to product_inquiries: ${categoryError.message}`);
      try {
        // Fallback to product_inquiries category
        transporter = await createTransporter('product_inquiries');
        categorySettings = await emailStorage.getCategoryWithSettings('product_inquiries');
        
        if (!categorySettings?.smtp || !categorySettings.recipients?.length) {
          throw new Error('No email configuration found for product_inquiries fallback');
        }
        console.log(`✅ Using fallback product_inquiries SMTP settings: ${categorySettings.smtp.fromEmail}`);
      } catch (fallbackError) {
        console.log(`❌ Product_inquiries fallback failed, using admin: ${fallbackError.message}`);
        // Final fallback to admin category
        transporter = await createTransporter('admin');
        categorySettings = await emailStorage.getCategoryWithSettings('admin');
        
        if (!categorySettings?.smtp || !categorySettings.recipients?.length) {
          throw new Error('No email configuration found for any category including admin');
        }
        console.log(`✅ Using final admin fallback SMTP settings: ${categorySettings.smtp.fromEmail}`);
      }
    }

    const smtp = categorySettings.smtp;
    const recipients = categorySettings.recipients.filter(r => r.isActive);
    
    if (recipients.length === 0) {
      throw new Error('No active recipients found for product inquiries');
    }

    // Separate recipients by type and filter out sender email from all lists
    const toRecipients = recipients
      .filter((r: any) => (!r.recipientType || r.recipientType === 'to') && r.email.toLowerCase() !== smtp.fromEmail.toLowerCase())
      .map((r: any) => r.email);
    
    const ccRecipients = recipients
      .filter((r: any) => r.recipientType === 'cc' && r.email.toLowerCase() !== smtp.fromEmail.toLowerCase())
      .map((r: any) => r.email);
    
    const bccRecipients = recipients
      .filter((r: any) => r.recipientType === 'bcc' && r.email.toLowerCase() !== smtp.fromEmail.toLowerCase())
      .map((r: any) => r.email);
    
    // Add smart CC for monitoring (info@momtazchem.com) if not already present
    const monitoringEmail = 'info@momtazchem.com';
    const isMonitoringEmailPresent = 
      smtp.fromEmail.toLowerCase() === monitoringEmail.toLowerCase() ||
      toRecipients.some((email: string) => email.toLowerCase() === monitoringEmail.toLowerCase()) ||
      ccRecipients.some((email: string) => email.toLowerCase() === monitoringEmail.toLowerCase()) ||
      bccRecipients.some((email: string) => email.toLowerCase() === monitoringEmail.toLowerCase());
    
    if (!isMonitoringEmailPresent) {
      ccRecipients.push(monitoringEmail);
    }
    
    // Check if we have any recipients after filtering
    if (toRecipients.length === 0 && ccRecipients.length === 0 && bccRecipients.length === 0) {
      console.log('Skipping product inquiry email - no valid recipients after filtering');
      return;
    }

    const mailOptions = {
      from: `${smtp.fromName} <${smtp.fromEmail}>`,
      to: toRecipients.length > 0 ? toRecipients.join(', ') : undefined,
      cc: ccRecipients.length > 0 ? ccRecipients.join(', ') : undefined,
      bcc: bccRecipients.length > 0 ? bccRecipients.join(', ') : undefined,
      subject: inquiryData.subject,
      encoding: 'utf-8',
      charset: 'utf-8',
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
      toEmail: `TO: ${toRecipients.join(', ')} | CC: ${ccRecipients.join(', ')} | BCC: ${bccRecipients.join(', ')}`,
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

export async function sendPasswordResetEmail(resetData: PasswordResetData, req?: any): Promise<void> {
  try {
    const transporter = await createTransporter('admin');
    const categorySettings = await emailStorage.getCategoryWithSettings('admin');
    
    if (!categorySettings?.smtp) {
      throw new Error('No email configuration found for password reset');
    }

    const smtp = categorySettings.smtp;
    const { CONFIG } = await import('./config');
    const resetUrl = CONFIG.getCustomerPasswordResetUrl(resetData.token, req);
    
    // Skip password reset email if sender and recipient are the same
    if (resetData.email.toLowerCase() === smtp.fromEmail.toLowerCase()) {
      console.log('Skipping password reset email - sender is same as recipient');
      return;
    }
    
    // Smart CC: only add info@momtazchem.com if it's not already the sender or recipient
    const ccEmail = 'info@momtazchem.com';
    const ccList = (smtp.fromEmail.toLowerCase() !== ccEmail.toLowerCase() && 
                    resetData.email.toLowerCase() !== ccEmail.toLowerCase()) 
                    ? ccEmail : undefined;
    
    const mailOptions = {
      from: `${smtp.fromName} <${smtp.fromEmail}>`,
      to: resetData.email,
      cc: ccList,
      subject: 'Password Reset - Momtaz Chemical',
      encoding: 'utf-8',
      charset: 'utf-8',
      html: `
        <div style="direction: ltr; text-align: left; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset</h2>
          <p>Hello ${resetData.firstName ? `${resetData.firstName} ${resetData.lastName || ''}` : ''},</p>
          
          <p>We received a request to reset your password.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>To reset your password, click the link below:</strong></p>
            <a href="${resetUrl}" 
               style="display: inline-block; background: #2563eb; color: white; 
                      padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                      margin: 10px 0; font-weight: bold;">
              Reset Password
            </a>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
              This link is valid for 1 hour.
            </p>
            <div style="margin: 10px 0 0 0; padding: 10px; background: #f9f9f9; border-radius: 4px;">
              <p style="margin: 0; font-size: 12px; color: #666;">Copy this URL:</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #333; word-break: break-all; font-family: monospace;">${resetUrl}</p>
            </div>
          </div>
          
          <p>If you did not request this, please ignore this email.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #666; font-size: 14px;">
            Thank you,<br>
            Momtaz Chemical Technical Team<br>
            <a href="https://momtazchem.com" style="color: #2563eb;">momtazchem.com</a>
          </p>
        </div>
      `,
      text: `
Password Reset

Hello ${resetData.firstName ? `${resetData.firstName} ${resetData.lastName || ''}` : ''},

We received a request to reset your password.

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

export interface QuoteRequestEmailData {
  to: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  customerPhone: string;
  productCategory: string;
  quantity: string;
  specifications: string;
  timeline: string;
  additionalMessage: string;
  inquiryType: string;
}

export async function sendQuoteRequestEmail(quoteData: QuoteRequestEmailData): Promise<void> {
  try {
    const transporter = await createTransporter('admin');
    const categorySettings = await emailStorage.getCategoryWithSettings('admin');
    
    if (!categorySettings?.smtp) {
      throw new Error('No email configuration found for quote request emails');
    }

    const smtp = categorySettings.smtp;
    
    // Skip quote request email if sender and recipient are the same
    if (quoteData.to.toLowerCase() === smtp.fromEmail.toLowerCase()) {
      console.log('Skipping quote request email - sender is same as recipient');
      return;
    }
    
    // Smart CC: only add info@momtazchem.com if it's not already the sender or recipient
    const ccEmail = 'info@momtazchem.com';
    const ccList = (smtp.fromEmail.toLowerCase() !== ccEmail.toLowerCase() && 
                    quoteData.to.toLowerCase() !== ccEmail.toLowerCase()) 
                    ? ccEmail : undefined;
    
    const mailOptions = {
      from: `${smtp.fromName} <${smtp.fromEmail}>`,
      to: quoteData.to,
      cc: ccList,
      replyTo: quoteData.customerEmail,
      subject: quoteData.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            New Quote Request from Website
          </h2>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="color: #065f46; margin-top: 0;">Customer Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Name:</td>
                <td style="padding: 8px 0;">${quoteData.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Email:</td>
                <td style="padding: 8px 0;">
                  <a href="mailto:${quoteData.customerEmail}" style="color: #059669;">${quoteData.customerEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Company:</td>
                <td style="padding: 8px 0;">${quoteData.customerCompany}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Phone:</td>
                <td style="padding: 8px 0;">${quoteData.customerPhone}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">Product Requirements</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Product Category:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #059669;">${quoteData.productCategory}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Required Quantity:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #dc2626;">${quoteData.quantity}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Timeline:</td>
                <td style="padding: 8px 0;">${quoteData.timeline}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Product Specifications</h3>
            <p style="line-height: 1.6; color: #4b5563; white-space: pre-wrap; background: #f9fafb; padding: 15px; border-radius: 6px;">${quoteData.specifications}</p>
          </div>
          
          ${quoteData.additionalMessage ? `
          <div style="background: #fff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Additional Requirements</h3>
            <p style="line-height: 1.6; color: #4b5563; white-space: pre-wrap;">${quoteData.additionalMessage}</p>
          </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
            <h4 style="color: #059669; margin-top: 0;">Next Steps:</h4>
            <ul style="color: #666; line-height: 1.6;">
              <li>Review product requirements and specifications</li>
              <li>Prepare detailed pricing and availability information</li>
              <li>Contact customer within 24 hours with preliminary quote</li>
              <li>Schedule follow-up meeting if needed</li>
            </ul>
            <p style="margin: 15px 0 0 0; color: #666; font-size: 14px; font-style: italic;">
              This quote request was submitted through the Momtaz Chemical website.
            </p>
          </div>
        </div>
      `,
      text: `
New Quote Request from Website

Customer Information:
Name: ${quoteData.customerName}
Email: ${quoteData.customerEmail}
Company: ${quoteData.customerCompany}
Phone: ${quoteData.customerPhone}

Product Requirements:
Product Category: ${quoteData.productCategory}
Required Quantity: ${quoteData.quantity}
Timeline: ${quoteData.timeline}

Product Specifications:
${quoteData.specifications}

${quoteData.additionalMessage ? `Additional Requirements:\n${quoteData.additionalMessage}\n` : ''}

Next Steps:
- Review product requirements and specifications
- Prepare detailed pricing and availability information
- Contact customer within 24 hours with preliminary quote
- Schedule follow-up meeting if needed

This quote request was submitted through the Momtaz Chemical website.
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Quote request email sent successfully to:', quoteData.to);

    // Log email
    await emailStorage.logEmail({
      categoryId: categorySettings.category.id,
      toEmail: quoteData.to,
      fromEmail: smtp.fromEmail,
      subject: mailOptions.subject,
      status: 'sent',
      sentAt: new Date(),
    });

  } catch (error) {
    console.error('Error sending quote request email:', error);
    throw error;
  }
}