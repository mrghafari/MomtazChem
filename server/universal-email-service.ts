import nodemailer from "nodemailer";
import { emailStorage } from "./email-storage";

export interface UniversalEmailOptions {
  categoryKey: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
  variables?: { [key: string]: string };
  templateNumber?: string; // NEW: Template number reference (e.g., "#05", "#13")
}

export class UniversalEmailService {
  
  /**
   * Send email using category-specific SMTP configuration
   */
  static async sendEmail(options: UniversalEmailOptions): Promise<boolean> {
    try {
      console.log(`📧 [Universal Email] Sending email for category: ${options.categoryKey}${options.templateNumber ? ` using template ${options.templateNumber}` : ''}`);
      
      // If template number specified, load and use template
      if (options.templateNumber) {
        try {
          const template = await emailStorage.getTemplateByNumber(options.templateNumber);
          if (template) {
            console.log(`📧 Template ${options.templateNumber} found: ${template.templateName}`);
            
            // Process template with variables if provided
            if (options.variables) {
              let processedHtml = template.htmlContent;
              let processedSubject = template.subject;
              
              for (const [key, value] of Object.entries(options.variables)) {
                const placeholder = `{{${key}}}`;
                processedHtml = processedHtml.replace(new RegExp(placeholder, 'g'), value);
                processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
              }
              
              // Update options with template content
              options.html = processedHtml;
              options.subject = processedSubject;
              options.text = template.textContent || processedHtml.replace(/<[^>]*>/g, ''); // Strip HTML for text version
            } else {
              // Use template as-is
              options.html = template.htmlContent;
              options.subject = template.subject;
              options.text = template.textContent || template.htmlContent.replace(/<[^>]*>/g, '');
            }
          } else {
            console.warn(`⚠️ Template ${options.templateNumber} not found, using provided content`);
          }
        } catch (templateError) {
          console.error(`❌ Error loading template ${options.templateNumber}:`, templateError);
        }
      }
      
      // Get category with SMTP settings
      const categorySettings = await emailStorage.getCategoryWithSettings(options.categoryKey);
      
      if (!categorySettings?.smtp) {
        console.error(`❌ No SMTP configuration found for category: ${options.categoryKey}`);
        return false;
      }

      const smtp = categorySettings.smtp;
      
      // If no recipients provided, use category default recipients
      let finalTo = options.to || [];
      let finalCc = options.cc || [];
      let finalBcc = options.bcc || [];
      
      if (finalTo.length === 0) {
        // Get recipients from category configuration
        const primaryRecipients = categorySettings.recipients.filter(r => r.recipientType === 'to' && r.isActive);
        finalTo = primaryRecipients.map(r => r.email);
        console.log(`📧 [Universal Email] Using category recipients for ${options.categoryKey}: ${finalTo.join(', ')}`);
      }
      
      if (finalCc.length === 0) {
        // Get CC recipients from category configuration
        const ccRecipients = categorySettings.recipients.filter(r => r.recipientType === 'cc' && r.isActive);
        finalCc = ccRecipients.map(r => r.email);
      }
      
      if (finalBcc.length === 0) {
        // Get BCC recipients from category configuration
        const bccRecipients = categorySettings.recipients.filter(r => r.recipientType === 'bcc' && r.isActive);
        finalBcc = bccRecipients.map(r => r.email);
      }
      
      // Create transporter
      const transporter = nodemailer.createTransport({
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

      // Get reply-to address from category recipients
      let replyTo = smtp.fromEmail; // Default fallback
      const categoryRecipients = categorySettings.recipients.filter(r => r.recipientType === 'to' && r.isActive);
      if (categoryRecipients.length > 0) {
        replyTo = categoryRecipients[0].email; // Use first active recipient as reply-to
      }

      // Send email
      const mailOptions = {
        from: `${smtp.fromName} <${smtp.fromEmail}>`,
        replyTo: replyTo, // Responses will go to category email
        to: finalTo.join(', '),
        cc: finalCc.length > 0 ? finalCc.join(', ') : undefined,
        bcc: finalBcc.length > 0 ? finalBcc.join(', ') : undefined,
        subject: finalSubject,
        html: finalHtml,
        text: finalText,
        attachments: options.attachments
      };

      await transporter.sendMail(mailOptions);
      
      // Log successful email to both old and new logging systems
      await emailStorage.logEmail({
        categoryId: categorySettings.category.id,
        toEmail: `TO: ${finalTo.join(', ')} | CC: ${finalCc?.join(', ') || ''} | BCC: ${finalBcc?.join(', ') || ''}`,
        fromEmail: smtp.fromEmail,
        subject: finalSubject,
        status: 'sent',
        sentAt: new Date()
      });

      // Log to new automatic email logs system
      await this.logAutomaticEmail({
        emailType: options.categoryKey,
        recipientEmail: finalTo[0] || 'unknown',
        recipientName: '', // Can be enhanced with recipient names
        senderEmail: smtp.fromEmail,
        senderName: smtp.fromName,
        subject: finalSubject,
        htmlContent: finalHtml,
        textContent: finalText,
        templateUsed: options.templateNumber,
        categoryKey: options.categoryKey,
        triggerEvent: '', // Can be passed as parameter
        relatedEntityId: '', // Can be passed as parameter
        deliveryStatus: 'sent',
        sentAt: new Date(),
      });

      console.log(`✅ [Universal Email] Email sent successfully for category: ${options.categoryKey}`);
      return true;

    } catch (error) {
      console.error(`❌ [Universal Email] Error sending email for category ${options.categoryKey}:`, error);
      
      // Log failed email to both systems
      try {
        const categorySettings = await emailStorage.getCategoryWithSettings(options.categoryKey);
        if (categorySettings) {
          await emailStorage.logEmail({
            categoryId: categorySettings.category.id,
            toEmail: `TO: ${finalTo?.join(', ') || options.to?.join(', ') || ''} | CC: ${finalCc?.join(', ') || options.cc?.join(', ') || ''} | BCC: ${finalBcc?.join(', ') || options.bcc?.join(', ') || ''}`,
            fromEmail: categorySettings.smtp?.fromEmail || 'unknown',
            subject: options.subject,
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            sentAt: new Date()
          });

          // Log to new automatic email logs system
          await this.logAutomaticEmail({
            emailType: options.categoryKey,
            recipientEmail: (options.to && options.to[0]) || 'unknown',
            recipientName: '',
            senderEmail: categorySettings.smtp?.fromEmail || 'system@momtazchem.com',
            senderName: categorySettings.smtp?.fromName || 'System',
            subject: options.subject,
            htmlContent: options.html,
            textContent: options.text,
            templateUsed: options.templateNumber,
            categoryKey: options.categoryKey,
            triggerEvent: '',
            relatedEntityId: '',
            deliveryStatus: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
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
   * Log email to automatic_email_logs table
   */
  private static async logAutomaticEmail(logData: {
    emailType: string;
    recipientEmail: string;
    recipientName?: string;
    senderEmail: string;
    senderName?: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    templateUsed?: string;
    categoryKey?: string;
    triggerEvent?: string;
    relatedEntityId?: string;
    deliveryStatus: string;
    errorMessage?: string;
    sentAt?: Date;
  }): Promise<void> {
    try {
      const { pool } = await import('./db');
      
      await pool.query(`
        INSERT INTO automatic_email_logs (
          email_type, recipient_email, recipient_name, sender_email, sender_name,
          subject, html_content, text_content, template_used, category_key,
          trigger_event, related_entity_id, delivery_status, error_message, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        logData.emailType,
        logData.recipientEmail,
        logData.recipientName || null,
        logData.senderEmail,
        logData.senderName || null,
        logData.subject,
        logData.htmlContent,
        logData.textContent || null,
        logData.templateUsed || null,
        logData.categoryKey || null,
        logData.triggerEvent || null,
        logData.relatedEntityId || null,
        logData.deliveryStatus,
        logData.errorMessage || null,
        logData.sentAt || null
      ]);
      
      console.log(`📝 [EMAIL LOG] ${logData.emailType} to ${logData.recipientEmail} - ${logData.deliveryStatus}`);
    } catch (error: any) {
      console.error('❌ Failed to log automatic email:', error.message);
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
  static async sendPasswordResetEmail(email: string, resetToken: string, userName: string, req?: any) {
    const { CONFIG } = await import('./config');
    const resetLink = CONFIG.getPasswordResetUrl(resetToken, req);
    
    const templateVariables = {
      customer_name: userName,
      email_type: 'درخواست تغییر رمز عبور',
      email_content: 'درخواست تغییر رمز عبور برای حساب کاربری شما دریافت شد.',
      password_label: '',
      password_value: '',
      security_note: 'در صورتی که این درخواست را شما نداده‌اید، این ایمیل را نادیده بگیرید. این لینک تا 24 ساعت معتبر است.',
      action_url: resetLink,
      action_text: 'تغییر رمز عبور'
    };
    
    return await this.sendEmail({
      categoryKey: 'password-reset',
      to: [email],
      subject: 'Password Reset Request - Momtaz Chemical',
      html: `<h2>Fallback Template</h2>`, // Will be replaced by template #06
      templateNumber: '#06',
      variables: templateVariables
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

  /**
   * Send customer password reset email using template from database
   */
  static async sendPasswordResetEmail(customerEmail: string, resetToken: string, customerName: string, req?: any) {
    try {
      const { CONFIG } = await import('./config');
      const resetUrl = CONFIG.getCustomerPasswordResetUrl(resetToken, req);
      
      console.log(`📧 [Password Reset] Sending reset email to: ${customerEmail}`);
      console.log(`🔗 Reset URL: ${resetUrl}`);
      
      // Try to get template from database first
      try {
        const template = await emailStorage.getTemplates();
        const passwordResetTemplate = template.find(t => t.category === 'password-reset' && t.isActive);
        
        if (passwordResetTemplate) {
          console.log(`✓ Using database template: ${passwordResetTemplate.name}`);
          
          // Process template variables
          let htmlContent = passwordResetTemplate.htmlContent;
          let textContent = passwordResetTemplate.textContent || '';
          let subject = passwordResetTemplate.subject;
          
          const variables = {
            customer_name: customerName,
            reset_url: resetUrl,
            expiry_time: '1 ساعت'
          };
          
          // Replace variables in content
          Object.entries(variables).forEach(([key, value]) => {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            htmlContent = htmlContent.replace(placeholder, value || '');
            textContent = textContent.replace(placeholder, value || '');
            subject = subject.replace(placeholder, value || '');
          });
          
          return await this.sendEmail({
            categoryKey: 'password-reset',
            to: [customerEmail],
            subject: subject,
            html: htmlContent,
            text: textContent
          });
        }
      } catch (templateError) {
        console.warn('⚠️ Could not load template from database, using fallback:', templateError);
      }
      
      // Fallback to hardcoded template if database template not available
      return await this.sendEmail({
        categoryKey: 'password-reset',
        to: [customerEmail],
        subject: 'درخواست تغییر رمز عبور - ممتاز شیمی',
        html: `
          <div style="font-family: 'Vazir', Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1>🔐 درخواست تغییر رمز عبور</h1>
              <p>ممتاز شیمی - Chemical Solutions</p>
            </div>
            
            <div style="padding: 30px 20px; background-color: #ffffff; border: 1px solid #e5e7eb;">
              <p>سلام ${customerName} عزیز،</p>
              
              <p>درخواست تغییر رمز عبور برای حساب کاربری شما در سیستم ممتاز شیمی دریافت شد.</p>
              
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <strong>⚠️ توجه:</strong> اگر این درخواست را شما انجام نداده‌اید، لطفاً این ایمیل را نادیده بگیرید.
              </div>
              
              <p>برای تغییر رمز عبور خود، روی دکمه زیر کلیک کنید:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">تغییر رمز عبور</a>
              </div>
              
              <p><strong>مدت اعتبار:</strong> این لینک تنها برای <strong>1 ساعت</strong> معتبر است.</p>
              
              <p>اگر دکمه کار نمی‌کند، لینک زیر را کپی کرده و در مرورگر خود وارد کنید:</p>
              <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">${resetUrl}</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p>با تشکر،<br>
              تیم پشتیبانی ممتاز شیمی</p>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px;">
              <p><strong>ممتاز شیمی</strong> - ارائه‌دهنده راه‌کارهای شیمیایی</p>
              <p>📞 +964 770 999 6771 | 📧 noreply@momtazchem.com</p>
              <p>🌐 www.momtazchem.com</p>
              <p style="margin-top: 15px; font-size: 11px;">
                این ایمیل به صورت خودکار ارسال شده است. لطفاً پاسخ ندهید.
              </p>
            </div>
          </div>
        `,
        text: `سلام ${customerName} عزیز،

درخواست تغییر رمز عبور برای حساب کاربری شما در سیستم ممتاز شیمی دریافت شد.

⚠️ توجه: اگر این درخواست را شما انجام نداده‌اید، لطفاً این ایمیل را نادیده بگیرید.

برای تغییر رمز عبور خود، روی لینک زیر کلیک کنید:
${resetUrl}

مدت اعتبار: این لینک تنها برای 1 ساعت معتبر است.

با تشکر،
تیم پشتیبانی ممتاز شیمی

📞 +964 770 999 6771
📧 noreply@momtazchem.com  
🌐 www.momtazchem.com

این ایمیل به صورت خودکار ارسال شده است. لطفاً پاسخ ندهید.`,
        variables: {
          customer_name: customerName,
          reset_url: resetUrl,
          expiry_time: '1 ساعت'
        }
      });
    } catch (error) {
      console.error('❌ Error in sendPasswordResetEmail:', error);
      return false;
    }
  }
}