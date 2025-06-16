import {
  specialistChatSessions,
  specialistChatMessages,
  specialists,
  type SpecialistChatSession,
  type SpecialistChatMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gt, lt, sql } from "drizzle-orm";

export interface ISpecialistChatStorage {
  // Session management
  createChatSession(sessionData: {
    specialistId: string;
    customerPhone: string;
    customerName: string;
  }): Promise<SpecialistChatSession>;
  
  getActiveSessionForSpecialist(specialistId: string): Promise<SpecialistChatSession | undefined>;
  getActiveSessionByPhone(customerPhone: string): Promise<SpecialistChatSession | undefined>;
  getSessionById(sessionId: string): Promise<SpecialistChatSession | undefined>;
  
  // Session status management
  endChatSession(sessionId: string, notes?: string, rating?: number): Promise<SpecialistChatSession>;
  updateSessionActivity(sessionId: string): Promise<void>;
  setTypingStatus(sessionId: string, isSpecialistTyping: boolean): Promise<void>;
  
  // Message management
  addMessage(messageData: {
    sessionId: string;
    sender: "specialist" | "customer";
    message: string;
    messageType?: string;
  }): Promise<SpecialistChatMessage>;
  
  getSessionMessages(sessionId: string): Promise<SpecialistChatMessage[]>;
  markMessagesAsRead(sessionId: string, sender: "specialist" | "customer"): Promise<void>;
  
  // Specialist dashboard
  getSpecialistActiveSessions(specialistId: string): Promise<SpecialistChatSession[]>;
  getSpecialistSessionHistory(specialistId: string, limit?: number): Promise<SpecialistChatSession[]>;
  
  // Admin overview
  getAllActiveSessions(): Promise<(SpecialistChatSession & { specialistName: string })[]>;
  getSessionStats(): Promise<{
    totalActiveSessions: number;
    totalCompletedToday: number;
    averageSessionDuration: number;
    busySpecialists: Array<{ specialistId: string; specialistName: string; activeSessionCount: number }>;
  }>;
  
  // Cleanup
  cleanupExpiredSessions(): Promise<void>;
}

export class SpecialistChatStorage implements ISpecialistChatStorage {
  async createChatSession(sessionData: {
    specialistId: string;
    customerPhone: string;
    customerName: string;
  }): Promise<SpecialistChatSession> {
    // Check if specialist already has an active session
    const existingSession = await this.getActiveSessionForSpecialist(sessionData.specialistId);
    if (existingSession) {
      throw new Error("Specialist already has an active chat session");
    }

    // Check if customer already has an active session
    const customerSession = await this.getActiveSessionByPhone(sessionData.customerPhone);
    if (customerSession) {
      throw new Error("Customer already has an active chat session");
    }

    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days retention

    const [session] = await db
      .insert(specialistChatSessions)
      .values({
        sessionId,
        specialistId: sessionData.specialistId,
        customerPhone: sessionData.customerPhone,
        customerName: sessionData.customerName,
        status: "active",
        messageCount: 0,
        isSpecialistTyping: false,
        isCustomerTyping: false,
        tags: [],
        expiresAt,
      })
      .returning();

    return session;
  }

  async getActiveSessionForSpecialist(specialistId: string): Promise<SpecialistChatSession | undefined> {
    const [session] = await db
      .select()
      .from(specialistChatSessions)
      .where(and(
        eq(specialistChatSessions.specialistId, specialistId),
        eq(specialistChatSessions.status, "active")
      ));

    return session;
  }

  async getActiveSessionByPhone(customerPhone: string): Promise<SpecialistChatSession | undefined> {
    const [session] = await db
      .select()
      .from(specialistChatSessions)
      .where(and(
        eq(specialistChatSessions.customerPhone, customerPhone),
        eq(specialistChatSessions.status, "active")
      ));

    return session;
  }

  async getSessionById(sessionId: string): Promise<SpecialistChatSession | undefined> {
    const [session] = await db
      .select()
      .from(specialistChatSessions)
      .where(eq(specialistChatSessions.sessionId, sessionId));

    return session;
  }

  async endChatSession(sessionId: string, notes?: string, rating?: number): Promise<SpecialistChatSession> {
    const updateData: any = {
      status: "completed",
      endedAt: new Date(),
    };

    if (notes) updateData.sessionNotes = notes;
    if (rating) updateData.customerRating = rating;

    const [session] = await db
      .update(specialistChatSessions)
      .set(updateData)
      .where(eq(specialistChatSessions.sessionId, sessionId))
      .returning();

    return session;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    await db
      .update(specialistChatSessions)
      .set({ lastMessageAt: new Date() })
      .where(eq(specialistChatSessions.sessionId, sessionId));
  }

  async setTypingStatus(sessionId: string, isSpecialistTyping: boolean): Promise<void> {
    await db
      .update(specialistChatSessions)
      .set({ isSpecialistTyping })
      .where(eq(specialistChatSessions.sessionId, sessionId));
  }

  async addMessage(messageData: {
    sessionId: string;
    sender: "specialist" | "customer";
    message: string;
    messageType?: string;
  }): Promise<SpecialistChatMessage> {
    const messageInsertData: InsertSpecialistChatMessage = {
      sessionId: messageData.sessionId,
      sender: messageData.sender,
      message: messageData.message,
      messageType: messageData.messageType || "text",
      isRead: false,
      attachments: [],
    };

    const [message] = await db
      .insert(specialistChatMessages)
      .values(messageInsertData)
      .returning();

    // Update session message count and last activity
    await db
      .update(specialistChatSessions)
      .set({
        messageCount: db.select().from(specialistChatMessages).where(eq(specialistChatMessages.sessionId, messageData.sessionId)),
        lastMessageAt: new Date(),
      })
      .where(eq(specialistChatSessions.sessionId, messageData.sessionId));

    return message;
  }

  async getSessionMessages(sessionId: string): Promise<SpecialistChatMessage[]> {
    return await db
      .select()
      .from(specialistChatMessages)
      .where(eq(specialistChatMessages.sessionId, sessionId))
      .orderBy(specialistChatMessages.timestamp);
  }

  async markMessagesAsRead(sessionId: string, sender: "specialist" | "customer"): Promise<void> {
    await db
      .update(specialistChatMessages)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(specialistChatMessages.sessionId, sessionId),
        eq(specialistChatMessages.sender, sender),
        eq(specialistChatMessages.isRead, false)
      ));
  }

  async getSpecialistActiveSessions(specialistId: string): Promise<SpecialistChatSession[]> {
    return await db
      .select()
      .from(specialistChatSessions)
      .where(and(
        eq(specialistChatSessions.specialistId, specialistId),
        eq(specialistChatSessions.status, "active")
      ))
      .orderBy(desc(specialistChatSessions.lastMessageAt));
  }

  async getSpecialistSessionHistory(specialistId: string, limit: number = 20): Promise<SpecialistChatSession[]> {
    return await db
      .select()
      .from(specialistChatSessions)
      .where(eq(specialistChatSessions.specialistId, specialistId))
      .orderBy(desc(specialistChatSessions.startedAt))
      .limit(limit);
  }

  async getAllActiveSessions(): Promise<(SpecialistChatSession & { specialistName: string })[]> {
    return await db
      .select({
        id: specialistChatSessions.id,
        sessionId: specialistChatSessions.sessionId,
        specialistId: specialistChatSessions.specialistId,
        customerPhone: specialistChatSessions.customerPhone,
        customerName: specialistChatSessions.customerName,
        status: specialistChatSessions.status,
        startedAt: specialistChatSessions.startedAt,
        lastMessageAt: specialistChatSessions.lastMessageAt,
        endedAt: specialistChatSessions.endedAt,
        messageCount: specialistChatSessions.messageCount,
        isSpecialistTyping: specialistChatSessions.isSpecialistTyping,
        isCustomerTyping: specialistChatSessions.isCustomerTyping,
        customerRating: specialistChatSessions.customerRating,
        sessionNotes: specialistChatSessions.sessionNotes,
        tags: specialistChatSessions.tags,
        expiresAt: specialistChatSessions.expiresAt,
        specialistName: specialists.name,
      })
      .from(specialistChatSessions)
      .leftJoin(specialists, eq(specialistChatSessions.specialistId, specialists.id))
      .where(eq(specialistChatSessions.status, "active"))
      .orderBy(desc(specialistChatSessions.lastMessageAt));
  }

  async getSessionStats(): Promise<{
    totalActiveSessions: number;
    totalCompletedToday: number;
    averageSessionDuration: number;
    busySpecialists: Array<{ specialistId: string; specialistName: string; activeSessionCount: number }>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count active sessions
    const activeSessionsResult = await db
      .select({ count: 'count(*)' })
      .from(specialistChatSessions)
      .where(eq(specialistChatSessions.status, "active"));

    // Count completed sessions today
    const completedTodayResult = await db
      .select({ count: 'count(*)' })
      .from(specialistChatSessions)
      .where(and(
        eq(specialistChatSessions.status, "completed"),
        gt(specialistChatSessions.endedAt, today)
      ));

    // Get busy specialists
    const busySpecialists = await db
      .select({
        specialistId: specialistChatSessions.specialistId,
        specialistName: specialists.name,
        activeSessionCount: 'count(*)'
      })
      .from(specialistChatSessions)
      .leftJoin(specialists, eq(specialistChatSessions.specialistId, specialists.id))
      .where(eq(specialistChatSessions.status, "active"))
      .groupBy(specialistChatSessions.specialistId, specialists.name);

    return {
      totalActiveSessions: Number(activeSessionsResult[0]?.count || 0),
      totalCompletedToday: Number(completedTodayResult[0]?.count || 0),
      averageSessionDuration: 0, // Calculate based on completed sessions
      busySpecialists: busySpecialists.map(s => ({
        specialistId: s.specialistId,
        specialistName: s.specialistName || 'Unknown',
        activeSessionCount: Number(s.activeSessionCount)
      }))
    };
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    
    // Mark expired sessions as abandoned
    await db
      .update(specialistChatSessions)
      .set({ status: "abandoned", endedAt: now })
      .where(and(
        eq(specialistChatSessions.status, "active"),
        gt(now, specialistChatSessions.expiresAt)
      ));

    // Delete sessions and messages older than 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    // First delete messages
    await db
      .delete(specialistChatMessages)
      .where(
        eq(specialistChatMessages.sessionId, 
          db.select({ sessionId: specialistChatSessions.sessionId })
            .from(specialistChatSessions)
            .where(gt(cutoffDate, specialistChatSessions.expiresAt))
        )
      );

    // Then delete sessions
    await db
      .delete(specialistChatSessions)
      .where(gt(cutoffDate, specialistChatSessions.expiresAt));
  }
}

export const specialistChatStorage = new SpecialistChatStorage();