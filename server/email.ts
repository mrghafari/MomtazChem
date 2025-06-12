import nodemailer from 'nodemailer';

// Create transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  productInterest: string;
  message: string | null;
}

export async function sendContactEmail(formData: ContactFormData): Promise<void> {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: 'info@momtazchem.com',
    subject: `New Contact Form Submission from ${formData.firstName} ${formData.lastName}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      <p><strong>Company:</strong> ${formData.company}</p>
      <p><strong>Product Interest:</strong> ${formData.productInterest}</p>
      <p><strong>Message:</strong></p>
      <p>${formData.message}</p>
      
      <hr>
      <p><em>This message was sent from the Momtazchem website contact form.</em></p>
    `,
  };

  await transporter.sendMail(mailOptions);
}