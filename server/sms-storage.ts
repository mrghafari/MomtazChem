import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, gt, desc } from "drizzle-orm";
import { 
  smsVerifications, 
  smsSettings, 
  customerSmsSettings,
  type InsertSmsVerification,
  type SmsVerification,
  type InsertSmsSettings,
  type SmsSettings,
  type InsertCustomerSmsSettings,
  type CustomerSmsSettings
} from "../shared/schema";

export const smsPool = new Pool({ connectionString: process.env.DATABASE_URL });
export const smsDb = drizzle({ client: smsPool, schema: { smsVerifications, smsSettings, customerSmsSettings } });

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
      .set({ attempts: smsVerifications.attempts + 1 })
      .where(eq(smsVerifications.id, id));
  }
  
  async cleanupExpiredVerifications(): Promise<void> {
    await smsDb
      .delete(smsVerifications)
      .where(gt(new Date(), smsVerifications.expiresAt));
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
      isEnabled: enabled,
      updatedAt: new Date()
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
    
    // Get customers with SMS enabled
    const customersWithSmsEnabled = await smsDb
      .select({ count: customerSmsSettings.id })
      .from(customerSmsSettings)
      .where(eq(customerSmsSettings.smsAuthEnabled, true));
    
    // Get system status
    const systemSettings = await this.getSmsSettings();
    
    return {
      totalVerifications: totalVerifications.length,
      verificationsSentToday: verificationsSentToday.length,
      successfulVerifications: successfulVerifications.length,
      customersWithSmsEnabled: customersWithSmsEnabled.length,
      systemEnabled: systemSettings?.isEnabled || false
    };
  }
}

export const smsStorage = new SmsStorage();