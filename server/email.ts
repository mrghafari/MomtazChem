import nodemailer from 'nodemailer';

// Create transporter using environment variables
const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT || '587');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim(),
    port: port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER?.trim(),
      pass: process.env.SMTP_PASS?.trim(),
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000, // 5 seconds
    socketTimeout: 10000, // 10 seconds
  });
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
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_USER?.trim(),
    to: 'info@momtazchem.com',
    subject: `New Contact Form Submission from ${formData.firstName} ${formData.lastName}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      <p><strong>Company:</strong> ${formData.company || 'Not provided'}</p>
      <p><strong>Product Interest:</strong> ${formData.productInterest}</p>
      <p><strong>Message:</strong></p>
      <p>${formData.message || 'No message provided'}</p>
      
      <hr>
      <p><em>This message was sent from the Momtazchem website contact form.</em></p>
    `,
  };

  // First verify the connection
  try {
    await transporter.verify();
    console.log('SMTP server connection verified successfully');
  } catch (verifyError) {
    console.error('SMTP verification failed:', verifyError);
    throw new Error('SMTP configuration is invalid');
  }

  // Set a timeout for email sending to prevent hanging
  const sendMailWithTimeout = () => {
    return Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout')), 15000)
      )
    ]);
  };

  await sendMailWithTimeout();
}

// Category-based email mapping
const getCategoryEmail = (category: string): string => {
  const categoryEmails = {
    'fuel-additives': 'fuel@momtazchem.com',
    'water-treatment': 'water@momtazchem.com', 
    'paint-thinner': 'thinner@momtazchem.com',
    'agricultural-fertilizers': 'fertilizer@momtazchem.com'
  };
  
  return categoryEmails[category as keyof typeof categoryEmails] || 'info@momtazchem.com';
};

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
  const transporter = createTransporter();
  const recipientEmail = getCategoryEmail(inquiryData.category);

  const mailOptions = {
    from: process.env.SMTP_USER?.trim(),
    to: recipientEmail,
    cc: 'info@momtazchem.com', // Always CC main email
    subject: `${inquiryData.type === 'quote_request' ? 'Quote Request' : 'Product Inquiry'} - ${inquiryData.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            ${inquiryData.type === 'quote_request' ? '💰 New Quote Request' : '📧 Product Inquiry'}
          </h1>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
          <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Inquiry Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Inquiry Number:</td>
                <td style="padding: 8px 0; color: #6b7280;">${inquiryData.inquiryNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Product:</td>
                <td style="padding: 8px 0; color: #6b7280;">${inquiryData.productName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Category:</td>
                <td style="padding: 8px 0; color: #6b7280;">${inquiryData.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Type:</td>
                <td style="padding: 8px 0; color: #6b7280;">${inquiryData.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Priority:</td>
                <td style="padding: 8px 0;">
                  <span style="background: ${inquiryData.priority === 'urgent' ? '#ef4444' : inquiryData.priority === 'high' ? '#f59e0b' : '#10b981'}; 
                              color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                    ${inquiryData.priority.toUpperCase()}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Customer Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
                <td style="padding: 8px 0; color: #6b7280;">${inquiryData.contactEmail}</td>
              </tr>
              ${inquiryData.contactPhone ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Phone:</td>
                <td style="padding: 8px 0; color: #6b7280;">${inquiryData.contactPhone}</td>
              </tr>
              ` : ''}
              ${inquiryData.company ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Company:</td>
                <td style="padding: 8px 0; color: #6b7280;">${inquiryData.company}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div style="background: white; padding: 20px; border-radius: 6px;">
            <h2 style="color: #1e40af; margin-top: 0;">Message</h2>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #374151; line-height: 1.6;">${inquiryData.message}</p>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
          <p>This inquiry was submitted through the Momtazchem website.</p>
          <p>Please respond within 24 hours to maintain our service standards.</p>
        </div>
      </div>
    `,
  };

  // First verify the connection
  try {
    await transporter.verify();
  } catch (verifyError) {
    console.error('SMTP verification failed:', verifyError);
    throw new Error('SMTP configuration is invalid');
  }

  // Send email with timeout
  const sendMailWithTimeout = () => {
    return Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout')), 15000)
      )
    ]);
  };

  await sendMailWithTimeout();
}