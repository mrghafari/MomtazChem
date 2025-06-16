import {
  monthlyCorrespondence,
  type MonthlyCorrespondence,
  type InsertMonthlyCorrespondence,
} from "@shared/correspondence-schema";
import { correspondenceDb } from "./correspondence-db";
import { eq, and, gte, lt } from "drizzle-orm";

export interface ICorrespondenceStorage {
  // Create new correspondence entry
  createCorrespondence(correspondence: InsertMonthlyCorrespondence): Promise<MonthlyCorrespondence>;
  
  // Get correspondence by phone number (last month only)
  getCorrespondenceByPhone(phone: string): Promise<MonthlyCorrespondence[]>;
  
  // Get all correspondence for a specialist (last month only)
  getCorrespondenceBySpecialist(specialistId: string): Promise<MonthlyCorrespondence[]>;
  
  // Update correspondence status
  updateCorrespondenceStatus(id: number, status: string): Promise<MonthlyCorrespondence>;
  
  // Auto-cleanup: Delete correspondence older than 1 month
  cleanupOldCorrespondence(): Promise<void>;
  
  // Get correspondence stats for dashboard
  getCorrespondenceStats(): Promise<{
    totalThisMonth: number;
    activeThisMonth: number;
    resolvedThisMonth: number;
    byChannel: Array<{ channel: string; count: number }>;
    bySpecialist: Array<{ specialistName: string; count: number }>;
  }>;
}

export class CorrespondenceStorage implements ICorrespondenceStorage {
  async createCorrespondence(correspondenceData: InsertMonthlyCorrespondence): Promise<MonthlyCorrespondence> {
    // Set expiration date to 1 month from now
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    const [correspondence] = await correspondenceDb
      .insert(monthlyCorrespondence)
      .values({
        ...correspondenceData,
        expiresAt,
      })
      .returning();
    
    return correspondence;
  }

  async getCorrespondenceByPhone(phone: string): Promise<MonthlyCorrespondence[]> {
    // Get only correspondence from the last month that hasn't expired
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const correspondence = await correspondenceDb
      .select()
      .from(monthlyCorrespondence)
      .where(
        and(
          eq(monthlyCorrespondence.customerPhone, phone),
          gte(monthlyCorrespondence.createdAt, oneMonthAgo)
        )
      )
      .orderBy(monthlyCorrespondence.createdAt);
    
    return correspondence;
  }

  async getCorrespondenceBySpecialist(specialistId: string): Promise<MonthlyCorrespondence[]> {
    // Get only correspondence from the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const correspondence = await correspondenceDb
      .select()
      .from(monthlyCorrespondence)
      .where(
        and(
          eq(monthlyCorrespondence.specialistId, specialistId),
          gte(monthlyCorrespondence.createdAt, oneMonthAgo)
        )
      )
      .orderBy(monthlyCorrespondence.createdAt);
    
    return correspondence;
  }

  async updateCorrespondenceStatus(id: number, status: string): Promise<MonthlyCorrespondence> {
    const [correspondence] = await correspondenceDb
      .update(monthlyCorrespondence)
      .set({ status })
      .where(eq(monthlyCorrespondence.id, id))
      .returning();
    
    return correspondence;
  }

  async cleanupOldCorrespondence(): Promise<void> {
    // Delete correspondence older than 1 month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    await correspondenceDb
      .delete(monthlyCorrespondence)
      .where(lt(monthlyCorrespondence.createdAt, oneMonthAgo));
  }

  async getCorrespondenceStats(): Promise<{
    totalThisMonth: number;
    activeThisMonth: number;
    resolvedThisMonth: number;
    byChannel: Array<{ channel: string; count: number }>;
    bySpecialist: Array<{ specialistName: string; count: number }>;
  }> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Get all correspondence from last month
    const allCorrespondence = await correspondenceDb
      .select()
      .from(monthlyCorrespondence)
      .where(gte(monthlyCorrespondence.createdAt, oneMonthAgo));
    
    const totalThisMonth = allCorrespondence.length;
    const activeThisMonth = allCorrespondence.filter(c => c.status === 'active').length;
    const resolvedThisMonth = allCorrespondence.filter(c => c.status === 'resolved').length;
    
    // Group by channel
    const channelCounts = allCorrespondence.reduce((acc, c) => {
      acc[c.channel] = (acc[c.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byChannel = Object.entries(channelCounts).map(([channel, count]) => ({
      channel,
      count,
    }));
    
    // Group by specialist
    const specialistCounts = allCorrespondence.reduce((acc, c) => {
      acc[c.specialistName] = (acc[c.specialistName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const bySpecialist = Object.entries(specialistCounts).map(([specialistName, count]) => ({
      specialistName,
      count,
    }));
    
    return {
      totalThisMonth,
      activeThisMonth,
      resolvedThisMonth,
      byChannel,
      bySpecialist,
    };
  }
}

export const correspondenceStorage = new CorrespondenceStorage();