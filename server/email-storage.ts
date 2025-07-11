import {
  emailCategories,
  smtpSettings,
  emailRecipients,
  emailTemplates,
  emailLogs,
  type EmailCategory,
  type InsertEmailCategory,
  type SmtpSetting,
  type InsertSmtpSetting,
  type EmailRecipient,
  type InsertEmailRecipient,
  type EmailTemplate,
  type InsertEmailTemplate,
  type EmailLog,
  type InsertEmailLog,
} from "@shared/email-schema";
import { emailDb } from "./email-db";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

export interface IEmailStorage {
  // Email Categories
  createCategory(category: InsertEmailCategory): Promise<EmailCategory>;
  getCategories(): Promise<EmailCategory[]>;
  getCategoryById(id: number): Promise<EmailCategory | undefined>;
  getCategoryByKey(key: string): Promise<EmailCategory | undefined>;
  updateCategory(id: number, category: Partial<InsertEmailCategory>): Promise<EmailCategory>;
  
  // SMTP Settings
  createSmtpSetting(setting: InsertSmtpSetting): Promise<SmtpSetting>;
  getSmtpSettings(): Promise<SmtpSetting[]>;
  getSmtpSettingById(id: number): Promise<SmtpSetting | undefined>;
  getSmtpSettingByCategory(categoryId: number): Promise<SmtpSetting | null>;
  updateSmtpSetting(id: number, setting: Partial<InsertSmtpSetting>): Promise<SmtpSetting>;
  deleteSmtpSetting(id: number): Promise<void>;
  testSmtpConnection(id: number): Promise<boolean>;
  
  // Email Recipients
  createRecipient(recipient: InsertEmailRecipient): Promise<EmailRecipient>;
  getRecipients(): Promise<EmailRecipient[]>;
  getRecipientsByCategory(categoryId: number): Promise<EmailRecipient[]>;
  updateRecipient(id: number, recipient: Partial<InsertEmailRecipient>): Promise<EmailRecipient>;
  deleteRecipient(id: number): Promise<void>;
  
  // Email Templates
  createTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  getTemplates(): Promise<EmailTemplate[]>;
  getTemplatesByCategory(categoryId: number): Promise<EmailTemplate[]>;
  getTemplateById(id: number): Promise<EmailTemplate | undefined>;
  updateTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteTemplate(id: number): Promise<void>;
  
  // Email Logs
  logEmail(log: InsertEmailLog): Promise<EmailLog>;
  getEmailLogs(limit?: number): Promise<EmailLog[]>;
  getEmailLogsByCategory(categoryId: number, limit?: number): Promise<EmailLog[]>;
  
  // Combined operations
  getCategoryWithSettings(categoryKey: string): Promise<{
    category: EmailCategory;
    smtp: SmtpSetting | null;
    recipients: EmailRecipient[];
  } | null>;
}

export class EmailStorage implements IEmailStorage {
  
  async createCategory(categoryData: InsertEmailCategory): Promise<EmailCategory> {
    const [category] = await emailDb
      .insert(emailCategories)
      .values(categoryData)
      .returning();
    return category;
  }
  
  async getCategories(): Promise<EmailCategory[]> {
    return await emailDb
      .select()
      .from(emailCategories)
      .orderBy(emailCategories.categoryName);
  }
  
  async getCategoryById(id: number): Promise<EmailCategory | undefined> {
    const [category] = await emailDb
      .select()
      .from(emailCategories)
      .where(eq(emailCategories.id, id));
    return category || undefined;
  }
  
  async getCategoryByKey(key: string): Promise<EmailCategory | undefined> {
    const [category] = await emailDb
      .select()
      .from(emailCategories)
      .where(eq(emailCategories.categoryKey, key));
    return category || undefined;
  }
  
  async updateCategory(id: number, categoryUpdate: Partial<InsertEmailCategory>): Promise<EmailCategory> {
    const [category] = await emailDb
      .update(emailCategories)
      .set({ ...categoryUpdate, updatedAt: new Date() })
      .where(eq(emailCategories.id, id))
      .returning();
    return category;
  }
  
  // SMTP Settings
  async createSmtpSetting(settingData: InsertSmtpSetting): Promise<SmtpSetting> {
    // Store password as is for now - in production, use proper encryption
    const [setting] = await emailDb
      .insert(smtpSettings)
      .values(settingData)
      .returning();
    return setting;
  }
  
  async getSmtpSettings(): Promise<SmtpSetting[]> {
    return await emailDb
      .select()
      .from(smtpSettings)
      .orderBy(smtpSettings.createdAt);
  }
  
  async getSmtpSettingById(id: number): Promise<SmtpSetting | undefined> {
    const [setting] = await emailDb
      .select()
      .from(smtpSettings)
      .where(eq(smtpSettings.id, id));
    return setting || undefined;
  }
  
  async getSmtpSettingByCategory(categoryId: number): Promise<SmtpSetting | null> {
    const [setting] = await emailDb
      .select()
      .from(smtpSettings)
      .where(and(
        eq(smtpSettings.categoryId, categoryId),
        eq(smtpSettings.isActive, true)
      ));
    return setting || null;
  }
  
  async updateSmtpSetting(id: number, settingUpdate: Partial<InsertSmtpSetting>): Promise<SmtpSetting> {
    let updateData = { ...settingUpdate, updatedAt: new Date() };
    
    const [setting] = await emailDb
      .update(smtpSettings)
      .set(updateData)
      .where(eq(smtpSettings.id, id))
      .returning();
    return setting;
  }
  
  async deleteSmtpSetting(id: number): Promise<void> {
    await emailDb
      .delete(smtpSettings)
      .where(eq(smtpSettings.id, id));
  }
  
  async testSmtpConnection(id: number): Promise<boolean> {
    try {
      const setting = await this.getSmtpSettingById(id);
      if (!setting) return false;
      
      const transporter = nodemailer.createTransport({
        host: setting.host,
        port: setting.port,
        secure: setting.port === 465 ? true : false,
        auth: {
          user: setting.username,
          pass: setting.password,
        },
        pool: false,
        socketTimeout: 20000,
        greetingTimeout: 10000,
        connectionTimeout: 20000,
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        requireTLS: true,
        debug: true,
        logger: true
      } as any);

      await transporter.verify();
      
      // Update test status
      await emailDb
        .update(smtpSettings)
        .set({ 
          testStatus: "success", 
          lastTested: new Date(),
          updatedAt: new Date()
        })
        .where(eq(smtpSettings.id, id));
      
      return true;
    } catch (error) {
      console.error("SMTP test error:", error);
      // Update test status
      await emailDb
        .update(smtpSettings)
        .set({ 
          testStatus: "failed", 
          lastTested: new Date(),
          updatedAt: new Date()
        })
        .where(eq(smtpSettings.id, id));
      
      return false;
    }
  }
  
  // Email Recipients
  async createRecipient(recipientData: InsertEmailRecipient): Promise<EmailRecipient> {
    // Clean the recipient data to prevent type conversion issues
    const cleanedData = {
      categoryId: recipientData.categoryId,
      email: recipientData.email,
      name: recipientData.name || null,
      isPrimary: Boolean(recipientData.isPrimary),
      isActive: Boolean(recipientData.isActive !== false),
      receiveTypes: Array.isArray(recipientData.receiveTypes) ? recipientData.receiveTypes : [],
      recipientType: recipientData.recipientType || 'to'
    };
    
    const [recipient] = await emailDb
      .insert(emailRecipients)
      .values(cleanedData)
      .returning();
    return recipient;
  }
  
  async getRecipients(): Promise<EmailRecipient[]> {
    return await emailDb
      .select()
      .from(emailRecipients)
      .orderBy(emailRecipients.email);
  }
  
  async getRecipientsByCategory(categoryId: number): Promise<EmailRecipient[]> {
    return await emailDb
      .select()
      .from(emailRecipients)
      .where(and(
        eq(emailRecipients.categoryId, categoryId),
        eq(emailRecipients.isActive, true)
      ))
      .orderBy(emailRecipients.isPrimary, emailRecipients.email);
  }
  
  async updateRecipient(id: number, recipientUpdate: Partial<InsertEmailRecipient>): Promise<EmailRecipient> {
    // Clean the update data to prevent timestamp conversion issues
    const cleanedUpdate = {
      email: recipientUpdate.email,
      name: recipientUpdate.name,
      isPrimary: recipientUpdate.isPrimary,
      isActive: recipientUpdate.isActive,
      receiveTypes: recipientUpdate.receiveTypes,
      recipientType: recipientUpdate.recipientType,
      updatedAt: new Date()
    };
    
    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(cleanedUpdate).filter(([_, value]) => value !== undefined)
    );
    
    const [recipient] = await emailDb
      .update(emailRecipients)
      .set(updateData)
      .where(eq(emailRecipients.id, id))
      .returning();
    return recipient;
  }
  
  async deleteRecipient(id: number): Promise<void> {
    await emailDb
      .delete(emailRecipients)
      .where(eq(emailRecipients.id, id));
  }
  
  // Email Templates
  async createTemplate(templateData: InsertEmailTemplate): Promise<EmailTemplate> {
    const [template] = await emailDb
      .insert(emailTemplates)
      .values(templateData)
      .returning();
    return template;
  }
  
  async getTemplates(): Promise<EmailTemplate[]> {
    return await emailDb
      .select()
      .from(emailTemplates)
      .orderBy(emailTemplates.templateName);
  }

  async getAllTemplates(): Promise<EmailTemplate[]> {
    const { desc } = await import("drizzle-orm");
    const { sql } = await import("drizzle-orm");
    
    const result = await emailDb.execute(sql`
      SELECT 
        id, 
        name as templateName, 
        category as categoryName,
        subject, 
        html_content as htmlContent, 
        text_content as textContent, 
        variables, 
        is_active as isActive, 
        is_default as isDefault, 
        language, 
        created_by as createdBy, 
        usage_count as usageCount, 
        last_used as lastUsed, 
        created_at as createdAt, 
        updated_at as updatedAt
      FROM email_templates 
      ORDER BY is_default DESC, name ASC
    `);
    
    return result.rows as EmailTemplate[];
  }
  
  async getTemplatesByCategory(categoryId: number): Promise<EmailTemplate[]> {
    return await emailDb
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.categoryId, categoryId),
        eq(emailTemplates.isActive, true)
      ))
      .orderBy(emailTemplates.isDefault, emailTemplates.templateName);
  }
  
  async getTemplateById(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await emailDb
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return template || undefined;
  }
  
  async updateTemplate(id: number, templateUpdate: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const [template] = await emailDb
      .update(emailTemplates)
      .set({ ...templateUpdate, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return template;
  }
  
  async deleteTemplate(id: number): Promise<void> {
    await emailDb
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, id));
  }

  async setDefaultTemplate(id: number, category: string): Promise<void> {
    // First remove default status from all templates in this category
    await emailDb
      .update(emailTemplates)
      .set({ isDefault: false })
      .where(eq(emailTemplates.category, category));

    // Then set the specified template as default
    await emailDb
      .update(emailTemplates)
      .set({ isDefault: true })
      .where(eq(emailTemplates.id, id));
  }
  
  // Email Logs
  async logEmail(logData: InsertEmailLog): Promise<EmailLog> {
    const [log] = await emailDb
      .insert(emailLogs)
      .values(logData)
      .returning();
    return log;
  }
  
  async getEmailLogs(limit: number = 100): Promise<EmailLog[]> {
    return await emailDb
      .select()
      .from(emailLogs)
      .orderBy(desc(emailLogs.createdAt))
      .limit(limit);
  }
  
  async getEmailLogsByCategory(categoryId: number, limit: number = 100): Promise<EmailLog[]> {
    return await emailDb
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.categoryId, categoryId))
      .orderBy(desc(emailLogs.createdAt))
      .limit(limit);
  }
  
  // Combined operations
  async getCategoryWithSettings(categoryKey: string): Promise<{
    category: EmailCategory;
    smtp: SmtpSetting | null;
    recipients: EmailRecipient[];
  } | null> {
    
    const category = await this.getCategoryByKey(categoryKey);
    if (!category) return null;
    
    const smtp = await this.getSmtpSettingByCategory(category.id);
    const recipients = await this.getRecipientsByCategory(category.id);
    
    return {
      category,
      smtp,
      recipients
    };
  }
}

export const emailStorage = new EmailStorage();