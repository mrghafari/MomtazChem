import { 
  liveChatSessions, 
  liveChatMessages, 
  guestCustomerForms, 
  specialistOnlineStatus,
  type LiveChatSession,
  type LiveChatMessage,
  type GuestCustomerForm,
  type SpecialistOnlineStatus,
  type InsertLiveChatSession,
  type InsertLiveChatMessage,
  type InsertGuestCustomerForm,
  type InsertSpecialistOnlineStatus
} from "@shared/live-chat-schema";
import { liveChatDb } from "./live-chat-db";
import { eq, desc, and, isNull, gte, avg, count } from "drizzle-orm";
import { crmStorage } from "./crm-storage";

export interface ILiveChatStorage {
  // مدیریت جلسه‌های چت
  createChatSession(session: InsertLiveChatSession): Promise<LiveChatSession>;
  getChatSession(sessionId: string): Promise<LiveChatSession | undefined>;
  updateChatSession(sessionId: string, updates: Partial<InsertLiveChatSession>): Promise<LiveChatSession>;
  endChatSession(sessionId: string, rating?: number, feedback?: string): Promise<void>;
  
  // مدیریت پیام‌ها
  addMessage(message: InsertLiveChatMessage): Promise<LiveChatMessage>;
  getSessionMessages(sessionId: string): Promise<LiveChatMessage[]>;
  markMessageAsRead(messageId: number): Promise<void>;
  markAllMessagesAsRead(sessionId: string, sender: string): Promise<void>;
  
  // مدیریت فرم مشتریان غیر لاگین
  saveGuestForm(form: InsertGuestCustomerForm): Promise<GuestCustomerForm>;
  getGuestForm(sessionId: string): Promise<GuestCustomerForm | undefined>;
  updateGuestForm(sessionId: string, updates: Partial<InsertGuestCustomerForm>): Promise<GuestCustomerForm>;
  syncGuestToCrm(sessionId: string): Promise<number | undefined>; // برگرداندن CRM customer ID
  
  // مدیریت وضعیت متخصصان
  updateSpecialistStatus(specialistId: string, status: InsertSpecialistOnlineStatus): Promise<SpecialistOnlineStatus>;
  getOnlineSpecialists(): Promise<SpecialistOnlineStatus[]>;
  getSpecialistStatus(specialistId: string): Promise<SpecialistOnlineStatus | undefined>;
  assignChatToSpecialist(sessionId: string, specialistId: string): Promise<void>;
  
  // آمار و گزارشات
  getActiveChatsCount(): Promise<number>;
  getSpecialistActiveChats(specialistId: string): Promise<LiveChatSession[]>;
  getChatAnalytics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    averageWaitTime: number;
    averageResponseTime: number;
    customerSatisfaction: number;
  }>;
}

export class LiveChatStorage implements ILiveChatStorage {
  async createChatSession(sessionData: InsertLiveChatSession): Promise<LiveChatSession> {
    const [session] = await liveChatDb
      .insert(liveChatSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getChatSession(sessionId: string): Promise<LiveChatSession | undefined> {
    const [session] = await liveChatDb
      .select()
      .from(liveChatSessions)
      .where(eq(liveChatSessions.sessionId, sessionId));
    return session || undefined;
  }

  async updateChatSession(sessionId: string, updates: Partial<InsertLiveChatSession>): Promise<LiveChatSession> {
    const [session] = await liveChatDb
      .update(liveChatSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(liveChatSessions.sessionId, sessionId))
      .returning();
    return session;
  }

  async endChatSession(sessionId: string, rating?: number, feedback?: string): Promise<void> {
    await liveChatDb
      .update(liveChatSessions)
      .set({
        status: "completed",
        endedAt: new Date(),
        customerRating: rating,
        customerFeedback: feedback,
        updatedAt: new Date()
      })
      .where(eq(liveChatSessions.sessionId, sessionId));
  }

  async addMessage(messageData: InsertLiveChatMessage): Promise<LiveChatMessage> {
    const [message] = await liveChatDb
      .insert(liveChatMessages)
      .values(messageData)
      .returning();

    // به‌روزرسانی آخرین زمان پیام در جلسه
    const [messageCountResult] = await liveChatDb
      .select({ count: liveChatMessages.id })
      .from(liveChatMessages)
      .where(eq(liveChatMessages.sessionId, messageData.sessionId));

    await liveChatDb
      .update(liveChatSessions)
      .set({
        lastMessageAt: new Date(),
        messageCount: (messageCountResult?.count || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(liveChatSessions.sessionId, messageData.sessionId));

    return message;
  }

  async getSessionMessages(sessionId: string): Promise<LiveChatMessage[]> {
    return await liveChatDb
      .select()
      .from(liveChatMessages)
      .where(eq(liveChatMessages.sessionId, sessionId))
      .orderBy(liveChatMessages.timestamp);
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await liveChatDb
      .update(liveChatMessages)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(eq(liveChatMessages.id, messageId));
  }

  async markAllMessagesAsRead(sessionId: string, sender: string): Promise<void> {
    await liveChatDb
      .update(liveChatMessages)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(
        and(
          eq(liveChatMessages.sessionId, sessionId),
          eq(liveChatMessages.sender, sender),
          eq(liveChatMessages.isRead, false)
        )
      );
  }

  async saveGuestForm(formData: InsertGuestCustomerForm): Promise<GuestCustomerForm> {
    const [form] = await liveChatDb
      .insert(guestCustomerForms)
      .values(formData)
      .returning();
    return form;
  }

  async getGuestForm(sessionId: string): Promise<GuestCustomerForm | undefined> {
    const [form] = await liveChatDb
      .select()
      .from(guestCustomerForms)
      .where(eq(guestCustomerForms.sessionId, sessionId));
    return form || undefined;
  }

  async updateGuestForm(sessionId: string, updates: Partial<InsertGuestCustomerForm>): Promise<GuestCustomerForm> {
    const [form] = await liveChatDb
      .update(guestCustomerForms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(guestCustomerForms.sessionId, sessionId))
      .returning();
    return form;
  }

  async syncGuestToCrm(sessionId: string): Promise<number | undefined> {
    const guestForm = await this.getGuestForm(sessionId);
    if (!guestForm || guestForm.syncedToCrm) {
      return guestForm?.crmCustomerId || undefined;
    }

    try {
      // ایجاد یا به‌روزرسانی مشتری در CRM
      const crmCustomer = await crmStorage.createOrUpdateCustomerFromOrder({
        email: guestForm.email || `${guestForm.phone}@guest.temp`,
        firstName: guestForm.firstName,
        lastName: guestForm.lastName,
        phone: guestForm.phone,
        orderValue: 0 // مشتری چت، نه خرید
      });

      // ثبت فعالیت چت در CRM
      await crmStorage.logCustomerActivity({
        customerId: crmCustomer.id,
        activityType: 'chat',
        description: `مشتری از طریق چت زنده تماس گرفت - جلسه: ${sessionId}`,
        activityData: {
          sessionId,
          channel: 'live_chat',
          timestamp: new Date().toISOString()
        }
      });

      // به‌روزرسانی فرم مهمان
      await this.updateGuestForm(sessionId, {
        crmCustomerId: crmCustomer.id,
        syncedToCrm: true
      });

      // به‌روزرسانی جلسه چت
      await this.updateChatSession(sessionId, {
        crmCustomerId: crmCustomer.id
      });

      return crmCustomer.id;
    } catch (error) {
      console.error('Error syncing guest to CRM:', error);
      return undefined;
    }
  }

  async updateSpecialistStatus(specialistId: string, statusData: InsertSpecialistOnlineStatus): Promise<SpecialistOnlineStatus> {
    const [status] = await liveChatDb
      .insert(specialistOnlineStatus)
      .values({
        specialistId,
        ...statusData,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: specialistOnlineStatus.specialistId,
        set: {
          ...statusData,
          updatedAt: new Date()
        }
      })
      .returning();
    return status;
  }

  async getOnlineSpecialists(): Promise<SpecialistOnlineStatus[]> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return await liveChatDb
      .select()
      .from(specialistOnlineStatus)
      .where(
        and(
          eq(specialistOnlineStatus.isAvailable, true),
          gte(specialistOnlineStatus.lastSeenAt, fiveMinutesAgo)
        )
      );
  }

  async getSpecialistStatus(specialistId: string): Promise<SpecialistOnlineStatus | undefined> {
    const [status] = await liveChatDb
      .select()
      .from(specialistOnlineStatus)
      .where(eq(specialistOnlineStatus.specialistId, specialistId));
    return status || undefined;
  }

  async assignChatToSpecialist(sessionId: string, specialistId: string): Promise<void> {
    // به‌روزرسانی جلسه چت
    await this.updateChatSession(sessionId, {
      assignedSpecialistId: specialistId,
      status: "active"
    });

    // به‌روزرسانی آمار متخصص
    const specialistStatus = await this.getSpecialistStatus(specialistId);
    if (specialistStatus) {
      const currentSessions = specialistStatus.currentSessionIds || [];
      await this.updateSpecialistStatus(specialistId, {
        activeChatSessions: specialistStatus.activeChatSessions + 1,
        currentSessionIds: [...currentSessions, sessionId],
        lastSeenAt: new Date()
      });
    }
  }

  async getActiveChatsCount(): Promise<number> {
    const [result] = await liveChatDb
      .select({ count: liveChatSessions.id })
      .from(liveChatSessions)
      .where(
        and(
          eq(liveChatSessions.status, "active"),
          isNull(liveChatSessions.endedAt)
        )
      );
    return result?.count || 0;
  }

  async getSpecialistActiveChats(specialistId: string): Promise<LiveChatSession[]> {
    return await liveChatDb
      .select()
      .from(liveChatSessions)
      .where(
        and(
          eq(liveChatSessions.assignedSpecialistId, specialistId),
          eq(liveChatSessions.status, "active"),
          isNull(liveChatSessions.endedAt)
        )
      )
      .orderBy(desc(liveChatSessions.lastMessageAt));
  }

  async getChatAnalytics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    averageWaitTime: number;
    averageResponseTime: number;
    customerSatisfaction: number;
  }> {
    // محاسبه آمار کلی
    const [totalSessions] = await liveChatDb
      .select({ count: liveChatSessions.id })
      .from(liveChatSessions);

    const [activeSessions] = await liveChatDb
      .select({ count: liveChatSessions.id })
      .from(liveChatSessions)
      .where(eq(liveChatSessions.status, "active"));

    // محاسبه میانگین زمان انتظار
    const [waitTimeResult] = await liveChatDb
      .select({ avg: liveChatSessions.waitingTime })
      .from(liveChatSessions)
      .where(liveChatSessions.waitingTime);

    // محاسبه میانگین زمان پاسخ
    const [responseTimeResult] = await liveChatDb
      .select({ avg: liveChatSessions.responseTime })
      .from(liveChatSessions)
      .where(liveChatSessions.responseTime);

    // محاسبه رضایت مشتری
    const [satisfactionResult] = await liveChatDb
      .select({ avg: liveChatSessions.customerRating })
      .from(liveChatSessions)
      .where(liveChatSessions.customerRating);

    return {
      totalSessions: totalSessions?.count || 0,
      activeSessions: activeSessions?.count || 0,
      averageWaitTime: Number(waitTimeResult?.avg) || 0,
      averageResponseTime: Number(responseTimeResult?.avg) || 0,
      customerSatisfaction: Number(satisfactionResult?.avg) || 0
    };
  }
}

export const liveChatStorage = new LiveChatStorage();