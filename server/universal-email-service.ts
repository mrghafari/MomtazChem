import nodemailer from "nodemailer";
import { emailStorage } from "./email-storage";

export interface UniversalEmailOptions {
  categoryKey: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
  variables?: { [key: string]: string };
}

export class UniversalEmailService {
  
  /**
   * Send email using category-specific SMTP configuration
   */
  static async sendEmail(options: UniversalEmailOptions): Promise<boolean> {
    try {
      console.log(`📧 [Universal Email] Sending email for category: ${options.categoryKey}`);
      
      // Get category with SMTP settings
      const categorySettings = await emailStorage.getCategoryWithSettings(options.categoryKey);
      
      if (!categorySettings?.smtp) {
        console.error(`❌ No SMTP configuration found for category: ${options.categoryKey}`);
        return false;
      }

      const smtp = categorySettings.smtp;
      
      // Create transporter
      const transporter = nodemailer.createTransporter({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465,
        auth: {
          user: smtp.username,
          pass: smtp.password,
        },
      });

      // Replace variables in content if provided
      let finalHtml = options.html;
      let finalText = options.text || '';
      let finalSubject = options.subject;

      if (options.variables) {
        for (const [key, value] of Object.entries(options.variables)) {
          const placeholder = `{{${key}}}`;
          finalHtml = finalHtml.replace(new RegExp(placeholder, 'g'), value);
          finalText = finalText.replace(new RegExp(placeholder, 'g'), value);
          finalSubject = finalSubject.replace(new RegExp(placeholder, 'g'), value);
        }
      }

      // Send email
      const mailOptions = {
        from: `${smtp.fromName} <${smtp.fromEmail}>`,
        to: options.to.join(', '),
        cc: options.cc?.join(', '),
        bcc: options.bcc?.join(', '),
        subject: finalSubject,
        html: finalHtml,
        text: finalText,
        attachments: options.attachments
      };

      await transporter.sendMail(mailOptions);
      
      // Log successful email
      await emailStorage.logEmail({
        categoryId: categorySettings.category.id,
        toEmail: `TO: ${options.to.join(', ')} | CC: ${options.cc?.join(', ') || ''} | BCC: ${options.bcc?.join(', ') || ''}`,
        fromEmail: smtp.fromEmail,
        subject: finalSubject,
        status: 'sent',
        sentAt: new Date()
      });

      console.log(`✅ [Universal Email] Email sent successfully for category: ${options.categoryKey}`);
      return true;

    } catch (error) {
      console.error(`❌ [Universal Email] Error sending email for category ${options.categoryKey}:`, error);
      
      // Log failed email
      try {
        const categorySettings = await emailStorage.getCategoryWithSettings(options.categoryKey);
        if (categorySettings) {
          await emailStorage.logEmail({
            categoryId: categorySettings.category.id,
            toEmail: `TO: ${options.to.join(', ')} | CC: ${options.cc?.join(', ') || ''} | BCC: ${options.bcc?.join(', ') || ''}`,
            fromEmail: categorySettings.smtp?.fromEmail || 'unknown',
            subject: options.subject,
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            sentAt: new Date()
          });
        }
      } catch (logError) {
        console.error('Error logging failed email:', logError);
      }

      return false;
    }
  }

  /**
   * Get available email categories
   */
  static async getAvailableCategories() {
    return await emailStorage.getCategories();
  }

  /**
   * Check if category has valid SMTP configuration
   */
  static async isCategoryConfigured(categoryKey: string): Promise<boolean> {
    try {
      const categorySettings = await emailStorage.getCategoryWithSettings(categoryKey);
      return !!(categorySettings?.smtp && 
               categorySettings.smtp.host && 
               categorySettings.smtp.username && 
               categorySettings.smtp.password);
    } catch {
      return false;
    }
  }

  /**
   * Get email template for category
   */
  static async getTemplate(categoryKey: string, templateKey: string) {
    const category = await emailStorage.getCategoryByKey(categoryKey);
    if (!category) return null;

    const templates = await emailStorage.getTemplatesByCategory(category.id);
    return templates.find(t => t.templateKey === templateKey);
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, resetLink: string, userName: string) {
    return await this.sendEmail({
      categoryKey: 'password-reset',
      to: [email],
      subject: 'Password Reset Request - Momtaz Chemical',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>You have requested to reset your password. Click the link below to reset your password:</p>
        <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Momtaz Chemical Team</p>
      `,
      text: `Password Reset Request\n\nHello ${userName},\n\nYou have requested to reset your password. Click the link below to reset your password:\n${resetLink}\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nMomtaz Chemical Team`
    });
  }

  /**
   * Send account verification email
   */
  static async sendAccountVerificationEmail(email: string, verificationLink: string, userName: string) {
    return await this.sendEmail({
      categoryKey: 'account-verification',
      to: [email],
      subject: 'Account Verification - Momtaz Chemical',
      html: `
        <h2>Account Verification</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for registering with Momtaz Chemical. Please verify your email address by clicking the link below:</p>
        <a href="${verificationLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If you didn't create this account, please ignore this email.</p>
        <p>Best regards,<br>Momtaz Chemical Team</p>
      `,
      text: `Account Verification\n\nHello ${userName},\n\nThank you for registering with Momtaz Chemical. Please verify your email address by clicking the link below:\n${verificationLink}\n\nIf you didn't create this account, please ignore this email.\n\nBest regards,\nMomtaz Chemical Team`
    });
  }

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmationEmail(email: string, orderNumber: string, orderDetails: any) {
    return await this.sendEmail({
      categoryKey: 'order-confirmations',
      to: [email],
      subject: `Order Confirmation #${orderNumber} - Momtaz Chemical`,
      html: `
        <h2>Order Confirmation</h2>
        <p>Thank you for your order!</p>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Order Details:</strong></p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
          ${JSON.stringify(orderDetails, null, 2)}
        </div>
        <p>We will process your order and notify you when it's ready for shipment.</p>
        <p>Best regards,<br>Momtaz Chemical Team</p>
      `,
      variables: {
        orderNumber,
        orderDetails: JSON.stringify(orderDetails, null, 2)
      }
    });
  }

  /**
   * Send payment notification email
   */
  static async sendPaymentNotificationEmail(email: string, paymentAmount: string, paymentMethod: string) {
    return await this.sendEmail({
      categoryKey: 'payment-notifications',
      to: [email],
      subject: 'Payment Confirmation - Momtaz Chemical',
      html: `
        <h2>Payment Confirmation</h2>
        <p>Your payment has been successfully processed.</p>
        <p><strong>Amount:</strong> ${paymentAmount}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        <p>Thank you for your business!</p>
        <p>Best regards,<br>Momtaz Chemical Team</p>
      `,
      variables: {
        paymentAmount,
        paymentMethod
      }
    });
  }

  /**
   * Send inventory alert email
   */
  static async sendInventoryAlertEmail(productName: string, currentStock: number, minStock: number) {
    return await this.sendEmail({
      categoryKey: 'inventory-alerts',
      to: [],
      subject: `Low Stock Alert: ${productName}`,
      html: `
        <h2>Low Stock Alert</h2>
        <p><strong>Product:</strong> ${productName}</p>
        <p><strong>Current Stock:</strong> ${currentStock}</p>
        <p><strong>Minimum Stock Level:</strong> ${minStock}</p>
        <p>Please restock this product as soon as possible.</p>
      `,
      variables: {
        productName,
        currentStock: currentStock.toString(),
        minStock: minStock.toString()
      }
    });
  }

  /**
   * Send system notification email
   */
  static async sendSystemNotificationEmail(title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium') {
    return await this.sendEmail({
      categoryKey: 'system-notifications',
      to: [],
      subject: `[${priority.toUpperCase()}] ${title}`,
      html: `
        <h2>System Notification</h2>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
          ${message}
        </div>
      `,
      variables: {
        title,
        message,
        priority
      }
    });
  }

  /**
   * Send security alert email
   */
  static async sendSecurityAlertEmail(alertType: string, details: string, userInfo?: any) {
    return await this.sendEmail({
      categoryKey: 'security-alerts',
      to: [],
      subject: `Security Alert: ${alertType}`,
      html: `
        <h2>Security Alert</h2>
        <p><strong>Alert Type:</strong> ${alertType}</p>
        <p><strong>Details:</strong></p>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
          ${details}
        </div>
        ${userInfo ? `<p><strong>User Info:</strong> ${JSON.stringify(userInfo, null, 2)}</p>` : ''}
        <p>Please investigate this security alert immediately.</p>
      `,
      variables: {
        alertType,
        details,
        userInfo: userInfo ? JSON.stringify(userInfo, null, 2) : ''
      }
    });
  }
}