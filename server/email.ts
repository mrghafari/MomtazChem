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
    const mailOptions = {
      from: `${smtp.fromName} <${smtp.fromEmail}>`,
      to: recipientEmails,
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