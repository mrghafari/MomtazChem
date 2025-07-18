import { db } from "./db";
import { 
  orphanOrdersSettings,
  orphanOrderSmsTemplates,
  orphanOrderEmailTemplates,
  orphanOrderNotificationSchedule,
  orphanOrderNotificationLog,
  orphanOrdersTracking,
  type OrphanOrdersSettings,
  type OrphanOrderSmsTemplate,
  type OrphanOrderEmailTemplate,
  type OrphanOrderNotificationSchedule,
  type OrphanOrderNotificationLog,
  type OrphanOrdersTracking,
  type InsertOrphanOrdersSettings,
  type InsertOrphanOrderSmsTemplate,
  type InsertOrphanOrderEmailTemplate,
  type InsertOrphanOrderNotificationSchedule,
  type InsertOrphanOrderNotificationLog,
  type InsertOrphanOrdersTracking,
  NOTIFICATION_TYPES,
  TEMPLATE_TYPES,
  PRIORITY_LEVELS,
  LANGUAGES
} from "../shared/orphan-orders-schema";
import { eq, and, desc, sql, lt, gte } from "drizzle-orm";

export class OrphanOrdersStorage {
  // Settings Management
  async getSettings(): Promise<OrphanOrdersSettings[]> {
    return await db.select().from(orphanOrdersSettings).orderBy(orphanOrdersSettings.settingKey);
  }

  async getSetting(key: string): Promise<OrphanOrdersSettings | null> {
    const result = await db.select().from(orphanOrdersSettings).where(eq(orphanOrdersSettings.settingKey, key));
    return result[0] || null;
  }

  async updateSetting(key: string, value: string, description?: string): Promise<void> {
    const existing = await this.getSetting(key);
    
    if (existing) {
      await db.update(orphanOrdersSettings)
        .set({ 
          settingValue: value, 
          description: description || existing.description,
          updatedAt: new Date()
        })
        .where(eq(orphanOrdersSettings.settingKey, key));
    } else {
      await db.insert(orphanOrdersSettings).values({
        settingKey: key,
        settingValue: value,
        description: description
      });
    }
  }

  // SMS Templates Management
  async getSmsTemplates(): Promise<OrphanOrderSmsTemplate[]> {
    return await db.select().from(orphanOrderSmsTemplates)
      .orderBy(orphanOrderSmsTemplates.templateType, orphanOrderSmsTemplates.language);
  }

  async getSmsTemplate(id: number): Promise<OrphanOrderSmsTemplate | null> {
    const result = await db.select().from(orphanOrderSmsTemplates).where(eq(orphanOrderSmsTemplates.id, id));
    return result[0] || null;
  }

  async createSmsTemplate(template: InsertOrphanOrderSmsTemplate): Promise<OrphanOrderSmsTemplate> {
    const result = await db.insert(orphanOrderSmsTemplates).values(template).returning();
    return result[0];
  }

  async updateSmsTemplate(id: number, template: Partial<InsertOrphanOrderSmsTemplate>): Promise<void> {
    await db.update(orphanOrderSmsTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(orphanOrderSmsTemplates.id, id));
  }

  async deleteSmsTemplate(id: number): Promise<void> {
    await db.delete(orphanOrderSmsTemplates).where(eq(orphanOrderSmsTemplates.id, id));
  }

  // Email Templates Management
  async getEmailTemplates(): Promise<OrphanOrderEmailTemplate[]> {
    return await db.select().from(orphanOrderEmailTemplates)
      .orderBy(orphanOrderEmailTemplates.templateType, orphanOrderEmailTemplates.language);
  }

  async getEmailTemplate(id: number): Promise<OrphanOrderEmailTemplate | null> {
    const result = await db.select().from(orphanOrderEmailTemplates).where(eq(orphanOrderEmailTemplates.id, id));
    return result[0] || null;
  }

  async createEmailTemplate(template: InsertOrphanOrderEmailTemplate): Promise<OrphanOrderEmailTemplate> {
    const result = await db.insert(orphanOrderEmailTemplates).values(template).returning();
    return result[0];
  }

  async updateEmailTemplate(id: number, template: Partial<InsertOrphanOrderEmailTemplate>): Promise<void> {
    await db.update(orphanOrderEmailTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(orphanOrderEmailTemplates.id, id));
  }

  async deleteEmailTemplate(id: number): Promise<void> {
    await db.delete(orphanOrderEmailTemplates).where(eq(orphanOrderEmailTemplates.id, id));
  }

  // Notification Schedule Management
  async getNotificationSchedules(): Promise<OrphanOrderNotificationSchedule[]> {
    return await db.select().from(orphanOrderNotificationSchedule)
      .orderBy(orphanOrderNotificationSchedule.triggerDaysBefore);
  }

  async getNotificationSchedule(id: number): Promise<OrphanOrderNotificationSchedule | null> {
    const result = await db.select().from(orphanOrderNotificationSchedule).where(eq(orphanOrderNotificationSchedule.id, id));
    return result[0] || null;
  }

  async createNotificationSchedule(schedule: InsertOrphanOrderNotificationSchedule): Promise<OrphanOrderNotificationSchedule> {
    const result = await db.insert(orphanOrderNotificationSchedule).values(schedule).returning();
    return result[0];
  }

  async updateNotificationSchedule(id: number, schedule: Partial<InsertOrphanOrderNotificationSchedule>): Promise<void> {
    await db.update(orphanOrderNotificationSchedule)
      .set({ ...schedule, updatedAt: new Date() })
      .where(eq(orphanOrderNotificationSchedule.id, id));
  }

  async deleteNotificationSchedule(id: number): Promise<void> {
    await db.delete(orphanOrderNotificationSchedule).where(eq(orphanOrderNotificationSchedule.id, id));
  }

  // Orphan Orders Tracking
  async getOrphanOrders(): Promise<OrphanOrdersTracking[]> {
    return await db.select().from(orphanOrdersTracking)
      .orderBy(desc(orphanOrdersTracking.createdAt));
  }

  async getOrphanOrder(orderId: number): Promise<OrphanOrdersTracking | null> {
    const result = await db.select().from(orphanOrdersTracking).where(eq(orphanOrdersTracking.orderId, orderId));
    return result[0] || null;
  }

  async createOrphanOrder(order: InsertOrphanOrdersTracking): Promise<OrphanOrdersTracking> {
    const result = await db.insert(orphanOrdersTracking).values(order).returning();
    return result[0];
  }

  async updateOrphanOrder(orderId: number, order: Partial<InsertOrphanOrdersTracking>): Promise<void> {
    await db.update(orphanOrdersTracking)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orphanOrdersTracking.orderId, orderId));
  }

  // Grace Period Management
  async getActiveGracePeriodOrders(): Promise<OrphanOrdersTracking[]> {
    return await db.select().from(orphanOrdersTracking)
      .where(and(
        eq(orphanOrdersTracking.isGracePeriodActive, true),
        eq(orphanOrdersTracking.isGracePeriodExpired, false)
      ))
      .orderBy(orphanOrdersTracking.gracePeriodEnd);
  }

  async getExpiredGracePeriodOrders(): Promise<OrphanOrdersTracking[]> {
    const now = new Date();
    return await db.select().from(orphanOrdersTracking)
      .where(and(
        eq(orphanOrdersTracking.isGracePeriodActive, true),
        lt(orphanOrdersTracking.gracePeriodEnd, now),
        eq(orphanOrdersTracking.isGracePeriodExpired, false)
      ));
  }

  async markGracePeriodExpired(orderId: number): Promise<void> {
    await db.update(orphanOrdersTracking)
      .set({ 
        isGracePeriodExpired: true,
        isGracePeriodActive: false,
        updatedAt: new Date()
      })
      .where(eq(orphanOrdersTracking.orderId, orderId));
  }

  // Notification Log Management
  async getNotificationLog(orderId?: number): Promise<OrphanOrderNotificationLog[]> {
    const query = db.select().from(orphanOrderNotificationLog);
    
    if (orderId) {
      return await query.where(eq(orphanOrderNotificationLog.orderId, orderId))
        .orderBy(desc(orphanOrderNotificationLog.sentAt));
    }
    
    return await query.orderBy(desc(orphanOrderNotificationLog.sentAt));
  }

  async logNotification(log: InsertOrphanOrderNotificationLog): Promise<OrphanOrderNotificationLog> {
    const result = await db.insert(orphanOrderNotificationLog).values(log).returning();
    return result[0];
  }

  async getNotificationCount(orderId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(orphanOrderNotificationLog)
      .where(eq(orphanOrderNotificationLog.orderId, orderId));
    
    return result[0]?.count || 0;
  }

  // Orders requiring notifications
  async getOrdersRequiringNotification(): Promise<{
    order: OrphanOrdersTracking;
    schedule: OrphanOrderNotificationSchedule;
    notificationCount: number;
  }[]> {
    const now = new Date();
    const activeOrders = await this.getActiveGracePeriodOrders();
    const activeSchedules = await db.select().from(orphanOrderNotificationSchedule)
      .where(eq(orphanOrderNotificationSchedule.isActive, true));

    const results = [];

    for (const order of activeOrders) {
      if (!order.gracePeriodEnd) continue;

      for (const schedule of activeSchedules) {
        const notificationCount = await this.getNotificationCount(order.orderId);
        
        // Check if max notifications reached
        if (notificationCount >= schedule.maxNotifications) continue;

        // Calculate notification trigger time
        const triggerTime = new Date(order.gracePeriodEnd);
        triggerTime.setDate(triggerTime.getDate() - schedule.triggerDaysBefore);
        triggerTime.setHours(triggerTime.getHours() - (schedule.triggerHoursBefore || 0));

        // Check if it's time to send notification
        if (now >= triggerTime) {
          results.push({
            order,
            schedule,
            notificationCount
          });
        }
      }
    }

    return results;
  }

  // Initialize default settings and templates
  async initializeDefaults(): Promise<void> {
    // Default settings
    const defaultSettings = [
      { key: 'grace_period_days', value: '3', description: 'Default grace period in days for bank transfer orders' },
      { key: 'max_notifications_per_order', value: '5', description: 'Maximum notifications to send per orphan order' },
      { key: 'notification_enabled', value: 'true', description: 'Enable/disable orphan order notifications' },
      { key: 'business_hours_start', value: '08:00', description: 'Business hours start time for notifications' },
      { key: 'business_hours_end', value: '18:00', description: 'Business hours end time for notifications' }
    ];

    for (const setting of defaultSettings) {
      const existing = await this.getSetting(setting.key);
      if (!existing) {
        await this.updateSetting(setting.key, setting.value, setting.description);
      }
    }

    // Default SMS templates
    const defaultSmsTemplates = [
      {
        templateName: 'Grace Period Reminder - Arabic',
        templateContent: 'عزيزي {{customer_name}}، تذكير بأن مهلة الدفع لطلبك رقم {{order_id}} ستنتهي في {{days_remaining}} أيام. يرجى رفع فيش الدفع. شركة ممتاز شيمي',
        variables: ['customer_name', 'order_id', 'days_remaining'],
        language: 'ar',
        templateType: 'reminder'
      },
      {
        templateName: 'Final Notice - Arabic',
        templateContent: 'تنبيه نهائي: مهلة الدفع لطلبك {{order_id}} ستنتهي خلال {{hours_remaining}} ساعة. يرجى إتمام الدفع فوراً. شركة ممتاز شيمي {{phone}}',
        variables: ['customer_name', 'order_id', 'hours_remaining', 'phone'],
        language: 'ar',
        templateType: 'final_notice'
      }
    ];

    for (const template of defaultSmsTemplates) {
      const existing = await db.select().from(orphanOrderSmsTemplates)
        .where(and(
          eq(orphanOrderSmsTemplates.templateName, template.templateName),
          eq(orphanOrderSmsTemplates.language, template.language)
        ));
      
      if (existing.length === 0) {
        await this.createSmsTemplate(template);
      }
    }

    // Default notification schedules
    const defaultSchedules = [
      {
        scheduleName: 'First Reminder - 2 Days Before',
        notificationType: 'both',
        triggerDaysBefore: 2,
        maxNotifications: 1,
        isActive: true
      },
      {
        scheduleName: 'Final Warning - 1 Day Before',
        notificationType: 'both',
        triggerDaysBefore: 1,
        maxNotifications: 2,
        isActive: true
      },
      {
        scheduleName: 'Last Hour Notice',
        notificationType: 'sms',
        triggerDaysBefore: 0,
        triggerHoursBefore: 1,
        maxNotifications: 1,
        isActive: true
      }
    ];

    for (const schedule of defaultSchedules) {
      const existing = await db.select().from(orphanOrderNotificationSchedule)
        .where(eq(orphanOrderNotificationSchedule.scheduleName, schedule.scheduleName));
      
      if (existing.length === 0) {
        await this.createNotificationSchedule(schedule);
      }
    }
  }
}

export const orphanOrdersStorage = new OrphanOrdersStorage();