import nodemailer from 'nodemailer';
import { db } from './db';
import { emailSettings } from '../shared/email-schema';
import { eq, and } from 'drizzle-orm';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private async getSMTPConfig(category: string = 'admin') {
    try {
      const [config] = await db
        .select()
        .from(emailSettings)
        .where(
          and(
            eq(emailSettings.category, category),
            eq(emailSettings.isActive, true)
          )
        )
        .limit(1);

      if (!config) {
        // Fallback to admin category if specific category not found
        const [adminConfig] = await db
          .select()
          .from(emailSettings)
          .where(
            and(
              eq(emailSettings.category, 'admin'),
              eq(emailSettings.isActive, true)
            )
          )
          .limit(1);
        
        return adminConfig;
      }

      return config;
    } catch (error) {
      console.error('Error fetching SMTP config:', error);
      return null;
    }
  }

  private async createTransporter(category: string = 'admin') {
    const config = await this.getSMTPConfig(category);
    
    if (!config) {
      throw new Error('No SMTP configuration found');
    }

    const transporter = nodemailer.createTransporter({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
    });

    return { transporter, config };
  }

  async sendPasswordResetEmail(email: string, resetToken: string, customerName: string) {
    try {
      const { transporter, config } = await this.createTransporter('admin');
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password/${resetToken}`;

      const htmlContent = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Momtaz Chemical</h1>
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
          </div>
          
          <p style="color: #333; line-height: 1.6;">Dear ${customerName},</p>
          
          <p style="color: #333; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            If you didn't request this password reset, please ignore this email. 
            This link will expire in 24 hours.
          </p>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
            <br><a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              Best regards,<br>
              Momtaz Chemical Support Team<br>
              support@momtazchem.com
            </p>
          </div>
        </div>
      `;

      const textContent = `
        Dear ${customerName},

        We received a request to reset your password. Please click the following link to create a new password:

        ${resetUrl}

        If you didn't request this password reset, please ignore this email. This link will expire in 24 hours.

        Best regards,
        Momtaz Chemical Support Team
        support@momtazchem.com
      `;

      await transporter.sendMail({
        from: `"Momtaz Chemical" <${config.smtpUsername}>`,
        to: email,
        subject: 'Password Reset Request - Momtaz Chemical',
        text: textContent,
        html: htmlContent,
      });

      console.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  async sendPasswordChangeNotification(email: string, customerName: string, newPassword?: string) {
    try {
      const { transporter, config } = await this.createTransporter('admin');

      const htmlContent = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Momtaz Chemical</h1>
            <h2 style="color: #333; margin-bottom: 20px;">Password Changed</h2>
          </div>
          
          <p style="color: #333; line-height: 1.6;">Dear ${customerName},</p>
          
          <p style="color: #333; line-height: 1.6;">
            Your account password has been successfully changed by our support team.
          </p>
          
          ${newPassword ? `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #333; margin-bottom: 10px;">Your New Password:</h3>
              <p style="font-family: monospace; font-size: 16px; color: #2563eb; font-weight: bold;">
                ${newPassword}
              </p>
              <p style="color: #dc2626; font-size: 14px; margin-top: 10px;">
                Please change this password after logging in for security reasons.
              </p>
            </div>
          ` : ''}
          
          <p style="color: #333; line-height: 1.6;">
            You can now log in to your account using your new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/login" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            If you didn't request this change, please contact our support team immediately.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              Best regards,<br>
              Momtaz Chemical Support Team<br>
              support@momtazchem.com
            </p>
          </div>
        </div>
      `;

      const textContent = `
        Dear ${customerName},

        Your account password has been successfully changed by our support team.

        ${newPassword ? `Your new password is: ${newPassword}

        Please change this password after logging in for security reasons.` : ''}

        You can now log in to your account using your new password.

        If you didn't request this change, please contact our support team immediately.

        Best regards,
        Momtaz Chemical Support Team
        support@momtazchem.com
      `;

      await transporter.sendMail({
        from: `"Momtaz Chemical" <${config.smtpUsername}>`,
        to: email,
        subject: 'Password Changed - Momtaz Chemical',
        text: textContent,
        html: htmlContent,
      });

      console.log(`Password change notification sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending password change notification:', error);
      return false;
    }
  }

  async sendEmail(options: EmailOptions, category: string = 'admin') {
    try {
      const { transporter, config } = await this.createTransporter(category);

      await transporter.sendMail({
        from: `"Momtaz Chemical" <${config.smtpUsername}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log(`Email sent to ${options.to}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();