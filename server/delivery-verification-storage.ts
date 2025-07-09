import { db } from "./db";
import { 
  deliveryVerificationCodes, 
  dailySmsStats,
  type DeliveryVerificationCode,
  type InsertDeliveryVerificationCode,
  type VerifyDeliveryCode
} from "@shared/delivery-verification-schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IDeliveryVerificationStorage {
  // Code generation and management
  generateVerificationCode(orderManagementId: number, customerOrderId: number, customerPhone: string): Promise<DeliveryVerificationCode>;
  getVerificationCode(customerOrderId: number): Promise<DeliveryVerificationCode | undefined>;
  verifyDeliveryCode(data: VerifyDeliveryCode): Promise<{ success: boolean; message: string; order?: any }>;
  
  // Code validation
  isCodeUnique(code: string, date: string): Promise<boolean>;
  getActiveCodeForOrder(customerOrderId: number): Promise<DeliveryVerificationCode | undefined>;
  
  // SMS tracking
  updateSmsStatus(id: number, status: 'sent' | 'delivered' | 'failed', details?: any): Promise<void>;
  getDailyStats(date: string): Promise<{ sent: number; delivered: number; failed: number; verified: number }>;
  
  // Delivery attempts
  incrementDeliveryAttempts(customerOrderId: number): Promise<void>;
  
  // Administrative functions
  getDeliveryCodesForDate(date: string): Promise<DeliveryVerificationCode[]>;
  getVerificationHistory(customerOrderId: number): Promise<DeliveryVerificationCode[]>;
  
  // Cleanup expired codes
  cleanupExpiredCodes(): Promise<number>;
}

export class DeliveryVerificationStorage implements IDeliveryVerificationStorage {
  
  async generateVerificationCode(orderManagementId: number, customerOrderId: number, customerPhone: string): Promise<DeliveryVerificationCode> {
    const today = new Date().toISOString().split('T')[0];
    
    // Generate unique 4-digit code
    let code: string;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;
      
      if (attempts > maxAttempts) {
        throw new Error('Unable to generate unique verification code');
      }
    } while (!(await this.isCodeUnique(code, today)));
    
    // Set expiration to end of day
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999);
    
    // Deactivate any existing codes for this order
    await db
      .update(deliveryVerificationCodes)
      .set({ isActive: false })
      .where(eq(deliveryVerificationCodes.customerOrderId, customerOrderId));
    
    // Create new verification code
    const [verificationCode] = await db
      .insert(deliveryVerificationCodes)
      .values({
        orderManagementId,
        customerOrderId,
        verificationCode: code,
        customerPhone,
        expiresAt,
        isActive: true,
      })
      .returning();
    
    return verificationCode;
  }
  
  async getVerificationCode(customerOrderId: number): Promise<DeliveryVerificationCode | undefined> {
    const [code] = await db
      .select()
      .from(deliveryVerificationCodes)
      .where(and(
        eq(deliveryVerificationCodes.customerOrderId, customerOrderId),
        eq(deliveryVerificationCodes.isActive, true)
      ))
      .orderBy(desc(deliveryVerificationCodes.createdAt))
      .limit(1);
    
    return code;
  }
  
  async verifyDeliveryCode(data: VerifyDeliveryCode): Promise<{ success: boolean; message: string; order?: any }> {
    const { verificationCode, customerOrderId, courierName, verificationNotes } = data;
    
    // Find the verification code
    const [codeRecord] = await db
      .select()
      .from(deliveryVerificationCodes)
      .where(and(
        eq(deliveryVerificationCodes.verificationCode, verificationCode),
        eq(deliveryVerificationCodes.customerOrderId, customerOrderId),
        eq(deliveryVerificationCodes.isActive, true),
        eq(deliveryVerificationCodes.isUsed, false)
      ));
    
    if (!codeRecord) {
      return { success: false, message: 'کد تأیید نامعتبر یا منقضی شده است' };
    }
    
    // Check if code is expired
    if (new Date() > new Date(codeRecord.expiresAt)) {
      return { success: false, message: 'کد تأیید منقضی شده است' };
    }
    
    // Mark code as used
    await db
      .update(deliveryVerificationCodes)
      .set({
        isUsed: true,
        verifiedAt: new Date(),
        verifiedBy: courierName,
        verificationNotes: verificationNotes || null,
      })
      .where(eq(deliveryVerificationCodes.id, codeRecord.id));
    
    // Update daily stats
    await this.updateDailyStats(new Date().toISOString().split('T')[0], 'verified');
    
    return { 
      success: true, 
      message: 'کد تأیید با موفقیت تأیید شد. کالا قابل تحویل است.',
      order: { customerOrderId, verificationCode }
    };
  }
  
  async isCodeUnique(code: string, date: string): Promise<boolean> {
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');
    
    const [existingCode] = await db
      .select()
      .from(deliveryVerificationCodes)
      .where(and(
        eq(deliveryVerificationCodes.verificationCode, code),
        sql`${deliveryVerificationCodes.createdAt} >= ${startOfDay}`,
        sql`${deliveryVerificationCodes.createdAt} <= ${endOfDay}`
      ))
      .limit(1);
    
    return !existingCode;
  }
  
  async getActiveCodeForOrder(customerOrderId: number): Promise<DeliveryVerificationCode | undefined> {
    const [code] = await db
      .select()
      .from(deliveryVerificationCodes)
      .where(and(
        eq(deliveryVerificationCodes.customerOrderId, customerOrderId),
        eq(deliveryVerificationCodes.isActive, true),
        eq(deliveryVerificationCodes.isUsed, false)
      ))
      .limit(1);
    
    return code;
  }
  
  async updateSmsStatus(id: number, status: 'sent' | 'delivered' | 'failed', details?: any): Promise<void> {
    const updateData: any = {};
    
    switch (status) {
      case 'sent':
        updateData.smsSent = true;
        updateData.smsSentAt = new Date();
        if (details?.messageId) updateData.smsMessageId = details.messageId;
        if (details?.provider) updateData.smsProvider = details.provider;
        break;
      case 'delivered':
        updateData.smsDelivered = true;
        updateData.smsDeliveredAt = new Date();
        break;
      case 'failed':
        updateData.smsFailureReason = details?.reason || 'Unknown error';
        break;
    }
    
    await db
      .update(deliveryVerificationCodes)
      .set(updateData)
      .where(eq(deliveryVerificationCodes.id, id));
    
    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    await this.updateDailyStats(today, status);
  }
  
  async getDailyStats(date: string): Promise<{ sent: number; delivered: number; failed: number; verified: number }> {
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');
    
    const [stats] = await db
      .select({
        sent: sql<number>`COUNT(CASE WHEN ${deliveryVerificationCodes.smsSent} = true THEN 1 END)`,
        delivered: sql<number>`COUNT(CASE WHEN ${deliveryVerificationCodes.smsDelivered} = true THEN 1 END)`,
        failed: sql<number>`COUNT(CASE WHEN ${deliveryVerificationCodes.smsFailureReason} IS NOT NULL THEN 1 END)`,
        verified: sql<number>`COUNT(CASE WHEN ${deliveryVerificationCodes.isUsed} = true THEN 1 END)`,
      })
      .from(deliveryVerificationCodes)
      .where(and(
        sql`${deliveryVerificationCodes.createdAt} >= ${startOfDay}`,
        sql`${deliveryVerificationCodes.createdAt} <= ${endOfDay}`
      ));
    
    return {
      sent: Number(stats.sent) || 0,
      delivered: Number(stats.delivered) || 0,
      failed: Number(stats.failed) || 0,
      verified: Number(stats.verified) || 0,
    };
  }
  
  async incrementDeliveryAttempts(customerOrderId: number): Promise<void> {
    await db
      .update(deliveryVerificationCodes)
      .set({
        deliveryAttempts: sql`${deliveryVerificationCodes.deliveryAttempts} + 1`,
        lastAttemptAt: new Date(),
      })
      .where(and(
        eq(deliveryVerificationCodes.customerOrderId, customerOrderId),
        eq(deliveryVerificationCodes.isActive, true)
      ));
  }
  
  async getDeliveryCodesForDate(date: string): Promise<DeliveryVerificationCode[]> {
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');
    
    return await db
      .select()
      .from(deliveryVerificationCodes)
      .where(and(
        sql`${deliveryVerificationCodes.createdAt} >= ${startOfDay}`,
        sql`${deliveryVerificationCodes.createdAt} <= ${endOfDay}`
      ))
      .orderBy(desc(deliveryVerificationCodes.createdAt));
  }
  
  async getVerificationHistory(customerOrderId: number): Promise<DeliveryVerificationCode[]> {
    return await db
      .select()
      .from(deliveryVerificationCodes)
      .where(eq(deliveryVerificationCodes.customerOrderId, customerOrderId))
      .orderBy(desc(deliveryVerificationCodes.createdAt));
  }
  
  async cleanupExpiredCodes(): Promise<number> {
    const now = new Date();
    
    const result = await db
      .update(deliveryVerificationCodes)
      .set({ isActive: false })
      .where(and(
        eq(deliveryVerificationCodes.isActive, true),
        sql`${deliveryVerificationCodes.expiresAt} < ${now}`
      ));
    
    return result.rowCount || 0;
  }
  
  private async updateDailyStats(date: string, type: 'sent' | 'delivered' | 'failed' | 'verified'): Promise<void> {
    const updateField = type === 'sent' ? 'totalSent' : 
                       type === 'delivered' ? 'totalDelivered' : 
                       type === 'failed' ? 'totalFailed' : 'totalVerified';
    
    await db
      .insert(dailySmsStats)
      .values({
        date,
        [updateField]: 1,
      })
      .onConflictDoUpdate({
        target: [dailySmsStats.date],
        set: {
          [updateField]: sql`${dailySmsStats[updateField]} + 1`,
          updatedAt: new Date(),
        },
      });
  }
}

export const deliveryVerificationStorage = new DeliveryVerificationStorage();