import { db } from "./db";
import { customerCommunications, emailCategories, CustomerCommunication, InsertCustomerCommunication } from "@shared/email-schema";
import { eq, desc, and, or, ilike } from "drizzle-orm";

export class CustomerCommunicationStorage {
  // Send a new message to customer with intelligent email routing
  async sendMessage(data: InsertCustomerCommunication): Promise<CustomerCommunication> {
    const [communication] = await db
      .insert(customerCommunications)
      .values(data)
      .returning();
    
    // If this is an outbound message, send actual email using category SMTP
    if (data.messageType === 'outbound') {
      await this.sendActualEmail(communication);
    }
    
    return communication;
  }

  // Send actual email using category-specific SMTP configuration
  private async sendActualEmail(communication: CustomerCommunication): Promise<void> {
    try {
      // Import smtpSettings from schema
      const { smtpSettings } = await import("@shared/email-schema");
      
      // Get category SMTP configuration
      const [categoryConfig] = await db
        .select({
          categoryName: emailCategories.categoryName,
          smtpHost: smtpSettings.host,
          smtpPort: smtpSettings.port,
          smtpSecure: smtpSettings.secure,
          smtpUsername: smtpSettings.username,
          smtpPassword: smtpSettings.password,
          smtpFromName: smtpSettings.fromName,
          smtpFromEmail: smtpSettings.fromEmail
        })
        .from(emailCategories)
        .leftJoin(smtpSettings, eq(emailCategories.id, smtpSettings.categoryId))
        .where(eq(emailCategories.id, communication.categoryId));

      if (!categoryConfig?.smtpHost) {
        console.error(`No SMTP configuration found for category ${communication.categoryId}`);
        return;
      }

      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.default.createTransport({
        host: categoryConfig.smtpHost,
        port: categoryConfig.smtpPort,
        secure: categoryConfig.smtpSecure,
        auth: {
          user: categoryConfig.smtpUsername,
          pass: categoryConfig.smtpPassword,
        },
      });

      const mailOptions = {
        from: `"${categoryConfig.smtpFromName}" <${categoryConfig.smtpFromEmail}>`,
        to: communication.customerEmail,
        subject: communication.subject,
        html: `
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
            <h2 style="color: #2563eb;">شرکت مومتاز کم</h2>
            <p>عزیز ${communication.customerName},</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${communication.message.replace(/\n/g, '<br>')}
            </div>
            <p>با تشکر,<br>تیم ${categoryConfig.categoryName}</p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #6b7280;">
              این ایمیل از سیستم مدیریت ارتباط با مشتریان مومتاز کم ارسال شده است.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${communication.customerEmail} via ${categoryConfig.categoryName}`);
      
      // Update communication status
      await db
        .update(customerCommunications)
        .set({ 
          status: 'delivered',
          updatedAt: new Date()
        })
        .where(eq(customerCommunications.id, communication.id));

    } catch (error) {
      console.error('Error sending email:', error);
      
      // Update communication status to failed
      await db
        .update(customerCommunications)
        .set({ 
          status: 'failed',
          updatedAt: new Date()
        })
        .where(eq(customerCommunications.id, communication.id));
    }
  }

  // Get all communications for a specific category
  async getCommunicationsByCategory(categoryId: number): Promise<CustomerCommunication[]> {
    return await db
      .select()
      .from(customerCommunications)
      .where(eq(customerCommunications.categoryId, categoryId))
      .orderBy(desc(customerCommunications.createdAt));
  }

  // Get all communications with a specific customer
  async getCommunicationsByCustomer(customerEmail: string): Promise<CustomerCommunication[]> {
    return await db
      .select()
      .from(customerCommunications)
      .where(eq(customerCommunications.customerEmail, customerEmail))
      .orderBy(desc(customerCommunications.createdAt));
  }

  // Get communication thread (message and its replies)
  async getCommunicationThread(messageId: number): Promise<CustomerCommunication[]> {
    return await db
      .select()
      .from(customerCommunications)
      .where(
        or(
          eq(customerCommunications.id, messageId),
          eq(customerCommunications.replyToMessageId, messageId)
        )
      )
      .orderBy(customerCommunications.createdAt);
  }

  // Mark message as read
  async markAsRead(messageId: number): Promise<void> {
    await db
      .update(customerCommunications)
      .set({ 
        readAt: new Date(),
        status: 'read'
      })
      .where(eq(customerCommunications.id, messageId));
  }

  // Mark message as replied
  async markAsReplied(messageId: number): Promise<void> {
    await db
      .update(customerCommunications)
      .set({ 
        repliedAt: new Date(),
        status: 'replied'
      })
      .where(eq(customerCommunications.id, messageId));
  }

  // Get recent communications (last 30 days)
  async getRecentCommunications(limit: number = 50): Promise<CustomerCommunication[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await db
      .select()
      .from(customerCommunications)
      .where(eq(customerCommunications.createdAt, thirtyDaysAgo))
      .orderBy(desc(customerCommunications.createdAt))
      .limit(limit);
  }

  // Get communication stats by category
  async getCommunicationStats(categoryId?: number) {
    let query = db.select().from(customerCommunications);
    
    if (categoryId) {
      query = query.where(eq(customerCommunications.categoryId, categoryId));
    }

    const communications = await query;

    const stats = {
      total: communications.length,
      sent: communications.filter(c => c.messageType === 'outbound').length,
      received: communications.filter(c => c.messageType === 'inbound').length,
      followUps: communications.filter(c => c.messageType === 'follow_up').length,
      replied: communications.filter(c => c.status === 'replied').length,
      pending: communications.filter(c => c.status === 'sent' || c.status === 'delivered').length,
    };

    return stats;
  }

  // Search communications by customer name or email
  async searchCommunications(searchTerm: string): Promise<CustomerCommunication[]> {
    return await db
      .select()
      .from(customerCommunications)
      .where(
        or(
          ilike(customerCommunications.customerEmail, `%${searchTerm}%`),
          ilike(customerCommunications.customerName, `%${searchTerm}%`),
          ilike(customerCommunications.subject, `%${searchTerm}%`),
          ilike(customerCommunications.message, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(customerCommunications.createdAt));
  }

  // Update communication status
  async updateStatus(messageId: number, status: string): Promise<void> {
    await db
      .update(customerCommunications)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(customerCommunications.id, messageId));
  }

  // Delete communication
  async deleteCommunication(messageId: number): Promise<void> {
    await db
      .delete(customerCommunications)
      .where(eq(customerCommunications.id, messageId));
  }

  // Get communication by ID
  async getCommunicationById(messageId: number): Promise<CustomerCommunication | undefined> {
    const [communication] = await db
      .select()
      .from(customerCommunications)
      .where(eq(customerCommunications.id, messageId))
      .limit(1);
    
    return communication;
  }
}

export const customerCommunicationStorage = new CustomerCommunicationStorage();