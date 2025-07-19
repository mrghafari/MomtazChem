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
  deleteCategory(id: number): Promise<void>;
  
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
  toggleTemplateStatus(id: number): Promise<EmailTemplate>;
  getTemplateByNumber(templateNumber: string): Promise<EmailTemplate | undefined>;
  
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

  async deleteCategory(id: number): Promise<void> {
    await emailDb
      .delete(emailCategories)
      .where(eq(emailCategories.id, id));
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
    try {
      const { sql } = await import("drizzle-orm");
      
      const result = await emailDb.execute(sql`
        SELECT 
          id, 
          name, 
          category,
          subject, 
          html_content, 
          text_content, 
          variables, 
          is_active, 
          is_default, 
          language, 
          created_by, 
          usage_count, 
          last_used, 
          created_at, 
          updated_at
        FROM email_templates 
        ORDER BY is_default DESC, name ASC
      `);
      
      // Convert database field names to expected interface field names
      const templates = result.rows.map((row: any) => ({
        id: row.id,
        templateName: row.name,
        categoryName: row.category,
        subject: row.subject,
        htmlContent: row.html_content,
        textContent: row.text_content,
        variables: row.variables,
        isActive: row.is_active,
        isDefault: row.is_default,
        language: row.language,
        createdBy: row.created_by,
        usageCount: row.usage_count,
        lastUsed: row.last_used,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      console.log('📧 Email templates found:', templates.length);
      console.log('📧 Template names:', templates.map(t => t.templateName));
      
      return templates;
    } catch (error) {
      console.error('Error fetching all templates:', error);
      return [];
    }
  }
  
  async getTemplatesByCategory(categoryName: string): Promise<EmailTemplate[]> {
    return await emailDb
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.category, categoryName),
        eq(emailTemplates.isActive, true)
      ))
      .orderBy(emailTemplates.templateName);
  }
  
  async getTemplateById(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await emailDb
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return template || undefined;
  }
  
  async updateTemplate(id: number, templateUpdate: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    try {
      const { sql } = await import("drizzle-orm");
      
      // Map frontend field names to database field names
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (templateUpdate.templateName !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(templateUpdate.templateName);
      }
      
      if (templateUpdate.categoryName !== undefined) {
        updateFields.push(`category = $${paramIndex++}`);
        values.push(templateUpdate.categoryName);
      }
      
      if (templateUpdate.subject !== undefined) {
        updateFields.push(`subject = $${paramIndex++}`);
        values.push(templateUpdate.subject);
      }
      
      if (templateUpdate.htmlContent !== undefined) {
        updateFields.push(`html_content = $${paramIndex++}`);
        values.push(templateUpdate.htmlContent);
      }
      
      if (templateUpdate.textContent !== undefined) {
        updateFields.push(`text_content = $${paramIndex++}`);
        values.push(templateUpdate.textContent);
      }
      
      if (templateUpdate.variables !== undefined) {
        updateFields.push(`variables = $${paramIndex++}`);
        values.push(templateUpdate.variables);
      }
      
      if (templateUpdate.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(templateUpdate.isActive);
      }
      
      if (templateUpdate.isDefault !== undefined) {
        updateFields.push(`is_default = $${paramIndex++}`);
        values.push(templateUpdate.isDefault);
      }
      
      if (templateUpdate.language !== undefined) {
        updateFields.push(`language = $${paramIndex++}`);
        values.push(templateUpdate.language);
      }
      
      // Always update the updated_at field
      updateFields.push(`updated_at = NOW()`);
      
      if (updateFields.length === 1) { // Only updated_at field
        throw new Error('No fields to update');
      }
      
      values.push(id); // Add id for WHERE clause
      
      const result = await emailDb.execute(sql.raw(`
        UPDATE email_templates 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING 
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
      `, values));
      
      if (result.rows.length === 0) {
        throw new Error('Template not found');
      }
      
      return result.rows[0] as EmailTemplate;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }
  
  async deleteTemplate(id: number): Promise<void> {
    await emailDb
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, id));
  }

  async toggleTemplateStatus(id: number): Promise<EmailTemplate> {
    try {
      const { sql } = await import("drizzle-orm");
      
      // First get current template to check if exists and get current status
      const currentTemplate = await emailDb.execute(sql`
        SELECT id, name, is_active
        FROM email_templates 
        WHERE id = ${id}
      `);
      
      if (currentTemplate.rows.length === 0) {
        throw new Error(`Template with ID ${id} not found`);
      }
      
      const currentStatus = currentTemplate.rows[0].is_active;
      const newStatus = !currentStatus;
      
      // Update template status
      const result = await emailDb.execute(sql`
        UPDATE email_templates 
        SET 
          is_active = ${newStatus},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING 
          id, 
          template_number as templateNumber,
          template_name as templateName, 
          category,
          subject, 
          html_content as htmlContent, 
          text_content as textContent, 
          variables, 
          is_active as isActive, 
          created_at as createdAt, 
          updated_at as updatedAt
      `);
      
      if (result.rows.length === 0) {
        throw new Error('Template not found after update');
      }
      
      return result.rows[0] as EmailTemplate;
    } catch (error) {
      console.error('Error toggling template status:', error);
      throw error;
    }
  }

  // Get template by numbered reference (e.g., "#05", "#13")
  async getTemplateByNumber(templateNumber: string): Promise<EmailTemplate | undefined> {
    try {
      const { sql } = await import("drizzle-orm");
      
      const result = await emailDb.execute(sql`
        SELECT 
          id, 
          name as templateName, 
          category,
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
        WHERE name LIKE '%' || ${templateNumber} || '%' 
        AND is_active = true
        ORDER BY name ASC
        LIMIT 1
      `);
      
      if (result.rows.length === 0) {
        console.warn(`❌ Template ${templateNumber} not found or inactive`);
        return undefined;
      }
      
      const template = result.rows[0] as any;
      console.log(`✅ Found template ${templateNumber}: ${template.templateName}`);
      return template;
    } catch (error) {
      console.error(`Error fetching template ${templateNumber}:`, error);
      return undefined;
    }
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