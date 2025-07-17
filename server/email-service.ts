import nodemailer from 'nodemailer';
import { db } from './db';
import { smtpSettings, emailTemplates } from '../shared/email-schema';
import { eq, and } from 'drizzle-orm';
import { getLocalizedMessage, getLocalizedEmailSubject } from './multilingual-messages';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  customerLanguage?: string;
  messageType?: string;
  variables?: Record<string, string>;
}

class EmailService {
  private async getSMTPConfig(category: string = 'admin') {
    try {
      // Map category strings to category IDs
      const categoryMap: { [key: string]: number } = {
        'admin': 1,
        'fuel-additives': 2,
        'water-treatment': 3,
        'agricultural-fertilizers': 4,
        'paint-thinner': 5,
        'orders': 6,
        'notifications': 7,
        'support': 7 // Support uses same category as notifications
      };

      const categoryId = categoryMap[category] || 1; // Default to admin if not found
      
      console.log(`[EMAIL DEBUG] Looking for SMTP config for category: ${category} (ID: ${categoryId})`);
      
      const [config] = await db
        .select()
        .from(smtpSettings)
        .where(
          and(
            eq(smtpSettings.categoryId, categoryId),
            eq(smtpSettings.isActive, true)
          )
        )
        .limit(1);

      if (!config) {
        // Fallback to default admin config if specific category not found
        const [adminConfig] = await db
          .select()
          .from(smtpSettings)
          .where(
            and(
              eq(smtpSettings.categoryId, 1), // Admin category
              eq(smtpSettings.isActive, true)
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

  private async getEmailTemplate(templateName: string) {
    try {
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(
          and(
            eq(emailTemplates.templateName, templateName),
            eq(emailTemplates.isActive, true)
          )
        )
        .limit(1);

      return template;
    } catch (error) {
      console.error('Error fetching email template:', error);
      return null;
    }
  }

  private processTemplate(content: string, variables: Record<string, string>): string {
    let processed = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value || '');
    });
    
    return processed;
  }

  private async createTransporter(category: string = 'admin') {
    const config = await this.getSMTPConfig(category);
    
    if (!config) {
      throw new Error('No SMTP configuration found');
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // Use secure only for port 465
      requireTLS: true,
      auth: {
        user: config.username,
        pass: config.password,
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });

    return { transporter, config };
  }

  async sendPasswordResetEmail(email: string, resetToken: string, customerName: string) {
    try {
      const { transporter, config } = await this.createTransporter('admin');
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password/${resetToken}`;

      const template = await this.getEmailTemplate('Password Management Template');
      
      if (template) {
        const variables = {
          customer_name: customerName,
          email_type: 'درخواست تغییر رمز عبور',
          email_content: 'درخواست تغییر رمز عبور برای حساب کاربری شما دریافت شد. روی دکمه زیر کلیک کنید تا رمز عبور جدید ایجاد کنید:',
          password_label: '',
          password_value: '',
          security_note: 'در صورتی که این درخواست را شما نداده‌اید، این ایمیل را نادیده بگیرید. این لینک تا 24 ساعت معتبر است.',
          action_url: resetUrl,
          action_text: 'تغییر رمز عبور'
        };

        const htmlContent = this.processTemplate(template.html_content || template.htmlContent, variables);
        const textContent = this.processTemplate(template.text_content || template.bodyText || template.html_content || template.htmlContent, variables);

        await transporter.sendMail({
          from: `"شرکت ممتاز شیمی" <${config.username}>`,
          to: email,
          subject: template.subject,
          text: textContent,
          html: htmlContent,
        });

        console.log(`Password reset email sent to ${email} using template`);
        return true;
      }

      // Fallback to hardcoded template if template not found
      const htmlContent = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; direction: rtl;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">شرکت ممتاز شیمی</h1>
            <h2 style="color: #333; margin-bottom: 20px;">درخواست تغییر رمز عبور</h2>
          </div>
          
          <p style="color: #333; line-height: 1.6;">${customerName} عزیز،</p>
          
          <p style="color: #333; line-height: 1.6;">
            درخواست تغییر رمز عبور برای حساب کاربری شما دریافت شد. روی دکمه زیر کلیک کنید تا رمز عبور جدید ایجاد کنید:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              تغییر رمز عبور
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            در صورتی که این درخواست را شما نداده‌اید، این ایمیل را نادیده بگیرید. این لینک تا 24 ساعت معتبر است.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              با احترام،<br>
              تیم پشتیبانی شرکت ممتاز شیمی<br>
              support@momtazchem.com
            </p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"شرکت ممتاز شیمی" <${config.smtpUsername}>`,
        to: email,
        subject: 'درخواست تغییر رمز عبور - شرکت ممتاز شیمی',
        html: htmlContent,
      });

      console.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  async sendPasswordChangeEmail(email: string, firstName: string, lastName: string, newPassword: string) {
    return this.sendPasswordChangeNotification(email, `${firstName} ${lastName}`, newPassword);
  }

  async sendPasswordChangeNotification(email: string, customerName: string, newPassword?: string) {
    try {
      console.log(`[EMAIL DEBUG] Starting password change notification for ${email}`);
      const { transporter, config } = await this.createTransporter('support');
      console.log(`[EMAIL DEBUG] Using SMTP config: ${config.username} (${config.host}:${config.port})`);

      // Skip template system for now and use hardcoded template
      console.log(`[EMAIL DEBUG] Using hardcoded template for password change notification`);
      
      if (false) { // Disable template system temporarily
        const variables = {
          customer_name: customerName,
          email_type: 'تغییر رمز عبور',
          email_content: newPassword ? 'رمز عبور حساب کاربری شما توسط تیم پشتیبانی ما با موفقیت تغییر یافت.' : 'رمز عبور حساب کاربری شما با موفقیت تغییر یافت.',
          password_label: newPassword ? 'رمز عبور جدید شما:' : '',
          password_value: newPassword || '',
          security_note: newPassword ? 'لطفاً پس از ورود به سیستم، رمز عبور خود را به دلایل امنیتی تغییر دهید.' : '',
          action_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/login`,
          action_text: 'ورود به حساب کاربری'
        };

        const htmlContent = this.processTemplate(template.html_content || template.htmlContent, variables);
        const textContent = this.processTemplate(template.text_content || template.bodyText || template.html_content || template.htmlContent, variables);

        console.log(`[EMAIL DEBUG] Sending email to ${email} with template`);
        const result = await transporter.sendMail({
          from: `"شرکت ممتاز شیمی" <${config.username}>`,
          to: email,
          subject: template.subject,
          text: textContent,
          html: htmlContent,
        });

        console.log(`[EMAIL DEBUG] Email sent successfully! Message ID: ${result.messageId}`);
        console.log(`Password change notification sent to ${email} using template`);
        return true;
      }

      // Fallback to hardcoded template if template not found
      const htmlContent = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; direction: rtl;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">شرکت ممتاز شیمی</h1>
            <h2 style="color: #333; margin-bottom: 20px;">تغییر رمز عبور</h2>
          </div>
          
          <p style="color: #333; line-height: 1.6;">${customerName} عزیز،</p>
          
          <p style="color: #333; line-height: 1.6;">
            رمز عبور حساب کاربری شما توسط تیم پشتیبانی ما با موفقیت تغییر یافت.
          </p>
          
          ${newPassword ? `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #333; margin-bottom: 10px;">رمز عبور جدید شما:</h3>
              <p style="font-family: monospace; font-size: 16px; color: #2563eb; font-weight: bold;">
                ${newPassword}
              </p>
              <p style="color: #dc2626; font-size: 14px; margin-top: 10px;">
                لطفاً پس از ورود به سیستم، رمز عبور خود را به دلایل امنیتی تغییر دهید.
              </p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/login" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              ورود به حساب کاربری
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            اگر این تغییر را شما درخواست نکرده‌اید، لطفاً بلافاصله با تیم پشتیبانی ما تماس بگیرید.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              با احترام،<br>
              تیم پشتیبانی شرکت ممتاز شیمی<br>
              support@momtazchem.com
            </p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"شرکت ممتاز شیمی" <${config.username}>`,
        to: email,
        subject: 'تغییر رمز عبور - شرکت ممتاز شیمی',
        html: htmlContent,
      });

      console.log(`Password change notification sent to ${email}`);
      return true;
    } catch (error) {
      console.error('[EMAIL ERROR] Error sending password change notification:', error);
      console.error('[EMAIL ERROR] Error details:', {
        message: error.message,
        code: error.code,
        responseCode: error.responseCode,
        response: error.response
      });
      return false;
    }
  }

  // Enhanced multilingual email sending method
  async sendLocalizedEmail(
    to: string,
    messageType: string,
    customerLanguage: string,
    variables: Record<string, string>,
    category: string = 'admin',
    customSubject?: string
  ): Promise<boolean> {
    try {
      const subject = customSubject || getLocalizedEmailSubject(messageType, customerLanguage);
      const message = getLocalizedMessage(messageType as any, customerLanguage, variables);
      
      return await this.sendEmail({
        to,
        subject,
        text: message,
        html: `<div style="font-family: Arial, sans-serif; direction: ${customerLanguage === 'ar' || customerLanguage === 'fa' || customerLanguage === 'ku' ? 'rtl' : 'ltr'}; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">Momtaz Chemistry / شرکت ممتاز شیمی</h1>
          </div>
          <p style="line-height: 1.6; color: #333;">${message}</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #666; font-size: 12px;">
              Best regards / با احترام<br>
              Momtaz Chemistry Support Team / تیم پشتیبانی ممتاز شیمی<br>
              +964 770 999 6771 | support@momtazchem.com
            </p>
          </div>
        </div>`
      }, category);
    } catch (error) {
      console.error('Error sending localized email:', error);
      return false;
    }
  }

  async sendEmail(options: EmailOptions, category: string = 'admin') {
    try {
      const { transporter, config } = await this.createTransporter(category);

      await transporter.sendMail({
        from: `"Momtaz Chemical" <${config.username}>`,
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