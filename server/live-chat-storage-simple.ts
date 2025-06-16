import { 
  liveChatSessions, 
  liveChatMessages, 
  guestCustomerForms,
  type LiveChatSession,
  type LiveChatMessage,
  type GuestCustomerForm,
  type InsertLiveChatSession,
  type InsertLiveChatMessage,
  type InsertGuestCustomerForm
} from "@shared/live-chat-schema";
import { liveChatDb } from "./live-chat-db";
import { eq, desc, and, isNull } from "drizzle-orm";
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
  
  // مدیریت فرم مشتریان غیر لاگین
  saveGuestForm(form: InsertGuestCustomerForm): Promise<GuestCustomerForm>;
  getGuestForm(sessionId: string): Promise<GuestCustomerForm | undefined>;
  syncGuestToCrm(sessionId: string): Promise<number | undefined>;
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
    await liveChatDb
      .update(liveChatSessions)
      .set({
        lastMessageAt: new Date(),
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
      await liveChatDb
        .update(guestCustomerForms)
        .set({
          crmCustomerId: crmCustomer.id,
          syncedToCrm: true,
          updatedAt: new Date()
        })
        .where(eq(guestCustomerForms.sessionId, sessionId));

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
}

export const liveChatStorage = new LiveChatStorage();