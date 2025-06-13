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