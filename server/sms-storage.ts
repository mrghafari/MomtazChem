import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, and, gt, desc, sql } from "drizzle-orm";
import { 
  smsVerifications, 
  smsSettings, 
  customerSmsSettings,
  smsTemplateCategories,
  smsTemplates,
  type InsertSmsVerification,
  type SmsVerification,
  type InsertSmsSettings,
  type SmsSettings,
  type InsertCustomerSmsSettings,
  type CustomerSmsSettings,
  type InsertSmsTemplateCategory,
  type SmsTemplateCategory,
  type InsertSmsTemplate,
  type SmsTemplate
} from "../shared/schema";

export const smsPool = new Pool({ connectionString: process.env.DATABASE_URL });
export const smsDb = drizzle({ client: smsPool, schema: { smsVerifications, smsSettings, customerSmsSettings, smsTemplateCategories, smsTemplates } });

export interface ISmsStorage {
  // SMS Verification Management
  createVerification(verification: InsertSmsVerification): Promise<SmsVerification>;
  getVerification(phone: string, code: string, purpose: string): Promise<SmsVerification | undefined>;
  markVerificationUsed(id: number): Promise<void>;
  incrementVerificationAttempts(id: number): Promise<void>;
  cleanupExpiredVerifications(): Promise<void>;
  
  // SMS Settings Management
  getSmsSettings(): Promise<SmsSettings | undefined>;
  updateSmsSettings(settings: Partial<InsertSmsSettings>): Promise<SmsSettings>;
  toggleSmsSystem(enabled: boolean, adminUsername: string): Promise<SmsSettings>;
  
  // Customer SMS Settings
  getCustomerSmsSettings(customerId: number): Promise<CustomerSmsSettings | undefined>;
  enableCustomerSms(customerId: number, adminUsername: string): Promise<CustomerSmsSettings>;
  disableCustomerSms(customerId: number, adminUsername: string): Promise<CustomerSmsSettings>;
  getCustomersWithSmsEnabled(): Promise<CustomerSmsSettings[]>;
  
  // SMS Statistics
  getSmsStats(): Promise<{
    totalVerifications: number;
    verificationsSentToday: number;
    successfulVerifications: number;
    customersWithSmsEnabled: number;
    systemEnabled: boolean;
  }>;
  
  // SMS Template Categories Management
  getAllTemplateCategories(): Promise<SmsTemplateCategory[]>;
  getTemplateCategoryById(id: number): Promise<SmsTemplateCategory | undefined>;
  createTemplateCategory(category: InsertSmsTemplateCategory): Promise<SmsTemplateCategory>;
  updateTemplateCategory(id: number, updates: Partial<InsertSmsTemplateCategory>): Promise<SmsTemplateCategory>;
  deleteTemplateCategory(id: number): Promise<void>;
  getNextCategoryNumber(): Promise<number>;
  
  // SMS Templates Management
  getAllTemplates(): Promise<(SmsTemplate & { categoryName: string })[]>;
  getTemplatesByCategory(categoryId: number): Promise<SmsTemplate[]>;
  getTemplateById(id: number): Promise<SmsTemplate | undefined>;
  createTemplate(template: InsertSmsTemplate): Promise<SmsTemplate>;
  updateTemplate(id: number, updates: Partial<InsertSmsTemplate>): Promise<SmsTemplate>;
  deleteTemplate(id: number): Promise<void>;
  getNextTemplateNumber(categoryId: number): Promise<number>;
  getTemplateBySystemUsage(systemUsage: string, isDefault?: boolean): Promise<SmsTemplate | undefined>;
  incrementTemplateUsage(id: number): Promise<void>;
}

export class SmsStorage implements ISmsStorage {
  
  async createVerification(verificationData: InsertSmsVerification): Promise<SmsVerification> {
    const [verification] = await smsDb
      .insert(smsVerifications)
      .values(verificationData)
      .returning();
    return verification;
  }
  
  async getVerification(phone: string, code: string, purpose: string): Promise<SmsVerification | undefined> {
    const [verification] = await smsDb
      .select()
      .from(smsVerifications)
      .where(
        and(
          eq(smsVerifications.phone, phone),
          eq(smsVerifications.code, code),
          eq(smsVerifications.purpose, purpose),
          eq(smsVerifications.isUsed, false),
          gt(smsVerifications.expiresAt, new Date())
        )
      )
      .limit(1);
    return verification;
  }
  
  async markVerificationUsed(id: number): Promise<void> {
    await smsDb
      .update(smsVerifications)
      .set({ isUsed: true })
      .where(eq(smsVerifications.id, id));
  }
  
  async incrementVerificationAttempts(id: number): Promise<void> {
    await smsDb
      .update(smsVerifications)
      .set({ attempts: sql`${smsVerifications.attempts} + 1` })
      .where(eq(smsVerifications.id, id));
  }
  
  async cleanupExpiredVerifications(): Promise<void> {
    await smsDb
      .delete(smsVerifications)
      .where(sql`expires_at < NOW()`);
  }
  
  async getSmsSettings(): Promise<SmsSettings | undefined> {
    const [settings] = await smsDb
      .select()
      .from(smsSettings)
      .limit(1);
    return settings;
  }
  
  async updateSmsSettings(settingsUpdate: Partial<InsertSmsSettings>): Promise<SmsSettings> {
    const existingSettings = await this.getSmsSettings();
    
    if (existingSettings) {
      const [updated] = await smsDb
        .update(smsSettings)
        .set({ ...settingsUpdate, updatedAt: new Date() })
        .where(eq(smsSettings.id, existingSettings.id))
        .returning();
      return updated;
    } else {
      const [created] = await smsDb
        .insert(smsSettings)
        .values(settingsUpdate)
        .returning();
      return created;
    }
  }
  
  async toggleSmsSystem(enabled: boolean, adminUsername: string): Promise<SmsSettings> {
    return await this.updateSmsSettings({ 
      isEnabled: enabled
    });
  }
  
  async getCustomerSmsSettings(customerId: number): Promise<CustomerSmsSettings | undefined> {
    const [settings] = await smsDb
      .select()
      .from(customerSmsSettings)
      .where(eq(customerSmsSettings.customerId, customerId))
      .limit(1);
    return settings;
  }
  
  async enableCustomerSms(customerId: number, adminUsername: string): Promise<CustomerSmsSettings> {
    const existingSettings = await this.getCustomerSmsSettings(customerId);
    
    if (existingSettings) {
      const [updated] = await smsDb
        .update(customerSmsSettings)
        .set({
          smsAuthEnabled: true,
          enabledBy: adminUsername,
          enabledAt: new Date(),
          disabledBy: null,
          disabledAt: null,
          updatedAt: new Date()
        })
        .where(eq(customerSmsSettings.id, existingSettings.id))
        .returning();
      return updated;
    } else {
      const [created] = await smsDb
        .insert(customerSmsSettings)
        .values({
          customerId,
          smsAuthEnabled: true,
          enabledBy: adminUsername,
          enabledAt: new Date()
        })
        .returning();
      return created;
    }
  }
  
  async disableCustomerSms(customerId: number, adminUsername: string): Promise<CustomerSmsSettings> {
    const existingSettings = await this.getCustomerSmsSettings(customerId);
    
    if (existingSettings) {
      const [updated] = await smsDb
        .update(customerSmsSettings)
        .set({
          smsAuthEnabled: false,
          disabledBy: adminUsername,
          disabledAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(customerSmsSettings.id, existingSettings.id))
        .returning();
      return updated;
    } else {
      const [created] = await smsDb
        .insert(customerSmsSettings)
        .values({
          customerId,
          smsAuthEnabled: false,
          disabledBy: adminUsername,
          disabledAt: new Date()
        })
        .returning();
      return created;
    }
  }
  
  async getCustomersWithSmsEnabled(): Promise<CustomerSmsSettings[]> {
    return await smsDb
      .select()
      .from(customerSmsSettings)
      .where(eq(customerSmsSettings.smsAuthEnabled, true))
      .orderBy(desc(customerSmsSettings.enabledAt));
  }
  
  async getSmsStats(): Promise<{
    totalVerifications: number;
    verificationsSentToday: number;
    successfulVerifications: number;
    customersWithSmsEnabled: number;
    systemEnabled: boolean;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get total verifications
    const totalVerifications = await smsDb
      .select({ count: smsVerifications.id })
      .from(smsVerifications);
    
    // Get verifications sent today
    const verificationsSentToday = await smsDb
      .select({ count: smsVerifications.id })
      .from(smsVerifications)
      .where(gt(smsVerifications.createdAt, today));
    
    // Get successful verifications
    const successfulVerifications = await smsDb
      .select({ count: smsVerifications.id })
      .from(smsVerifications)
      .where(eq(smsVerifications.isUsed, true));
    
    // Get customers with SMS enabled from CRM
    const { pool } = await import('./db');
    const customersResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM crm_customers
      WHERE sms_enabled = true AND is_active = true
    `);
    const customersWithSmsEnabledCount = parseInt(customersResult.rows[0]?.count || 0);
    
    // Get system status
    const systemSettings = await this.getSmsSettings();
    
    return {
      totalVerifications: totalVerifications.length,
      verificationsSentToday: verificationsSentToday.length,
      successfulVerifications: successfulVerifications.length,
      customersWithSmsEnabled: customersWithSmsEnabledCount,
      systemEnabled: systemSettings?.isEnabled || false
    };
  }

  // SMS Template Categories Management
  async getAllTemplateCategories(): Promise<SmsTemplateCategory[]> {
    return await smsDb
      .select()
      .from(smsTemplateCategories)
      .where(eq(smsTemplateCategories.isActive, true))
      .orderBy(smsTemplateCategories.displayOrder, smsTemplateCategories.categoryNumber);
  }

  async getTemplateCategoryById(id: number): Promise<SmsTemplateCategory | undefined> {
    const [category] = await smsDb
      .select()
      .from(smsTemplateCategories)
      .where(eq(smsTemplateCategories.id, id))
      .limit(1);
    return category;
  }

  async createTemplateCategory(categoryData: InsertSmsTemplateCategory): Promise<SmsTemplateCategory> {
    const [category] = await smsDb
      .insert(smsTemplateCategories)
      .values(categoryData)
      .returning();
    return category;
  }

  async updateTemplateCategory(id: number, updates: Partial<InsertSmsTemplateCategory>): Promise<SmsTemplateCategory> {
    const [updated] = await smsDb
      .update(smsTemplateCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smsTemplateCategories.id, id))
      .returning();
    return updated;
  }

  async deleteTemplateCategory(id: number): Promise<void> {
    await smsDb
      .update(smsTemplateCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(smsTemplateCategories.id, id));
  }

  async getNextCategoryNumber(): Promise<number> {
    const result = await smsDb
      .select({ maxNumber: sql`MAX(${smsTemplateCategories.categoryNumber})` })
      .from(smsTemplateCategories);
    
    const maxNumber = result[0]?.maxNumber || 0;
    return (maxNumber as number) + 1;
  }

  // SMS Templates Management
  async getAllTemplates(): Promise<(SmsTemplate & { categoryName: string })[]> {
    const templates = await smsDb
      .select({
        id: smsTemplates.id,
        categoryId: smsTemplates.categoryId,
        templateNumber: smsTemplates.templateNumber,
        templateName: smsTemplates.templateName,
        templateContent: smsTemplates.templateContent,
        variables: smsTemplates.variables,
        isDefault: smsTemplates.isDefault,
        isActive: smsTemplates.isActive,
        usageCount: smsTemplates.usageCount,
        lastUsed: smsTemplates.lastUsed,
        createdBy: smsTemplates.createdBy,
        createdAt: smsTemplates.createdAt,
        updatedAt: smsTemplates.updatedAt,
        categoryName: smsTemplateCategories.categoryName
      })
      .from(smsTemplates)
      .leftJoin(smsTemplateCategories, eq(smsTemplates.categoryId, smsTemplateCategories.id))
      .where(eq(smsTemplates.isActive, true))
      .orderBy(smsTemplates.categoryId, smsTemplates.templateNumber);
    
    return templates;
  }

  async getTemplatesByCategory(categoryId: number): Promise<SmsTemplate[]> {
    return await smsDb
      .select()
      .from(smsTemplates)
      .where(and(
        eq(smsTemplates.categoryId, categoryId),
        eq(smsTemplates.isActive, true)
      ))
      .orderBy(smsTemplates.templateNumber);
  }

  async getTemplateById(id: number): Promise<SmsTemplate | undefined> {
    const [template] = await smsDb
      .select()
      .from(smsTemplates)
      .where(eq(smsTemplates.id, id))
      .limit(1);
    return template;
  }

  async createTemplate(templateData: InsertSmsTemplate): Promise<SmsTemplate> {
    const [template] = await smsDb
      .insert(smsTemplates)
      .values(templateData)
      .returning();
    return template;
  }

  async updateTemplate(id: number, updates: Partial<InsertSmsTemplate>): Promise<SmsTemplate> {
    const [updated] = await smsDb
      .update(smsTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smsTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteTemplate(id: number): Promise<void> {
    await smsDb
      .update(smsTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(smsTemplates.id, id));
  }

  async getNextTemplateNumber(categoryId: number): Promise<number> {
    const result = await smsDb
      .select({ maxNumber: sql`MAX(${smsTemplates.templateNumber})` })
      .from(smsTemplates)
      .where(eq(smsTemplates.categoryId, categoryId));
    
    const maxNumber = result[0]?.maxNumber || 0;
    return (maxNumber as number) + 1;
  }

  async getTemplateBySystemUsage(systemUsage: string, isDefault?: boolean): Promise<SmsTemplate | undefined> {
    const categoryResult = await smsDb
      .select()
      .from(smsTemplateCategories)
      .where(and(
        eq(smsTemplateCategories.systemUsage, systemUsage),
        eq(smsTemplateCategories.isActive, true)
      ))
      .limit(1);

    if (!categoryResult[0]) return undefined;

    const query = smsDb
      .select()
      .from(smsTemplates)
      .where(and(
        eq(smsTemplates.categoryId, categoryResult[0].id),
        eq(smsTemplates.isActive, true)
      ));

    if (isDefault !== undefined) {
      query.where(eq(smsTemplates.isDefault, isDefault));
    }

    const [template] = await query.orderBy(smsTemplates.templateNumber).limit(1);
    return template;
  }

  async incrementTemplateUsage(id: number): Promise<void> {
    await smsDb
      .update(smsTemplates)
      .set({ 
        usageCount: sql`${smsTemplates.usageCount} + 1`,
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(smsTemplates.id, id));
  }
}

export const smsStorage = new SmsStorage();