import nodemailer from 'nodemailer';
import { db } from './db';
import { smtpSettings, emailTemplates } from '../shared/email-schema';
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
        .from(smtpSettings)
        .where(
          and(
            eq(smtpSettings.categoryId, 1), // Use categoryId instead of category
            eq(smtpSettings.isActive, true)
          )
        )
        .limit(1);

      if (!config) {
        // Fallback to default admin config if specific category not found
        const [adminConfig] = await db
          .select()
          .from(smtpSettings)
          .where(eq(smtpSettings.isActive, true))
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
            eq(emailTemplates.name, templateName),
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
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
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
      const { transporter, config } = await this.createTransporter('admin');

      const template = await this.getEmailTemplate('Password Management Template');
      
      if (template) {
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

        await transporter.sendMail({
          from: `"شرکت ممتاز شیمی" <${config.username}>`,
          to: email,
          subject: template.subject,
          text: textContent,
          html: htmlContent,
        });

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
      console.error('Error sending password change notification:', error);
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