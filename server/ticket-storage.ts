import {
  tickets,
  ticketCategories,
  ticketComments,
  ticketWatchers,
  ticketSettings,
  type Ticket,
  type InsertTicket,
  type TicketCategory,
  type InsertTicketCategory,
  type TicketComment,
  type InsertTicketComment,
  type TicketWatcher,
  type InsertTicketWatcher,
  type TicketSettings,
  type InsertTicketSettings,
} from "@shared/ticket-schema";
import { db } from "./db";
import { eq, desc, and, or, sql, like } from "drizzle-orm";

export interface ITicketStorage {
  // Ticket Management
  createTicket(ticketData: InsertTicket): Promise<Ticket>;
  getTickets(limit?: number, offset?: number): Promise<Ticket[]>;
  getTicketById(id: number): Promise<Ticket | undefined>;
  getTicketByNumber(ticketNumber: string): Promise<Ticket | undefined>;
  updateTicket(id: number, ticketData: Partial<InsertTicket>): Promise<Ticket>;
  deleteTicket(id: number): Promise<void>;
  searchTickets(query: string): Promise<Ticket[]>;
  getTicketsByStatus(status: string): Promise<Ticket[]>;
  getTicketsByCategory(categoryId: number): Promise<Ticket[]>;
  getTicketsByReporter(reporterEmail: string): Promise<Ticket[]>;
  
  // Ticket Categories
  createTicketCategory(categoryData: InsertTicketCategory): Promise<TicketCategory>;
  getTicketCategories(): Promise<TicketCategory[]>;
  getTicketCategoryById(id: number): Promise<TicketCategory | undefined>;
  updateTicketCategory(id: number, categoryData: Partial<InsertTicketCategory>): Promise<TicketCategory>;
  deleteTicketCategory(id: number): Promise<void>;
  
  // Ticket Comments
  createTicketComment(commentData: InsertTicketComment): Promise<TicketComment>;
  getTicketComments(ticketId: number): Promise<TicketComment[]>;
  deleteTicketComment(id: number): Promise<void>;
  
  // Ticket Watchers
  addTicketWatcher(watcherData: InsertTicketWatcher): Promise<TicketWatcher>;
  getTicketWatchers(ticketId: number): Promise<TicketWatcher[]>;
  removeTicketWatcher(ticketId: number, watcherEmail: string): Promise<void>;
  
  // Ticket Settings
  getTicketSettings(): Promise<TicketSettings | undefined>;
  updateTicketSettings(settingsData: Partial<InsertTicketSettings>): Promise<TicketSettings>;
  
  // Analytics & Statistics
  getTicketStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byCategory: Array<{ categoryName: string; count: number }>;
    byPriority: Array<{ priority: string; count: number }>;
    avgResolutionTime: number;
  }>;
  
  // Generate unique ticket number
  generateTicketNumber(): Promise<string>;
}

export class TicketStorage implements ITicketStorage {
  
  async generateTicketNumber(): Promise<string> {
    const settings = await this.getTicketSettings();
    const prefix = settings?.ticketPrefix || "TKT";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    const [ticket] = await db
      .insert(tickets)
      .values({
        ...ticketData,
        ticketNumber: ticketData.ticketNumber || await this.generateTicketNumber(),
        lastActivity: new Date(),
      })
      .returning();
    return ticket;
  }

  async getTickets(limit: number = 50, offset: number = 0): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .orderBy(desc(tickets.lastActivity))
      .limit(limit)
      .offset(offset);
  }

  async getTicketById(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id));
    return ticket;
  }

  async getTicketByNumber(ticketNumber: string): Promise<Ticket | undefined> {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.ticketNumber, ticketNumber));
    return ticket;
  }

  async updateTicket(id: number, ticketData: Partial<InsertTicket>): Promise<Ticket> {
    const [ticket] = await db
      .update(tickets)
      .set({
        ...ticketData,
        lastActivity: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();
    return ticket;
  }

  async deleteTicket(id: number): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  async searchTickets(query: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(
        or(
          like(tickets.title, `%${query}%`),
          like(tickets.description, `%${query}%`),
          like(tickets.ticketNumber, `%${query}%`),
          like(tickets.reporterEmail, `%${query}%`)
        )
      )
      .orderBy(desc(tickets.lastActivity));
  }

  async getTicketsByStatus(status: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.status, status))
      .orderBy(desc(tickets.lastActivity));
  }

  async getTicketsByCategory(categoryId: number): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.categoryId, categoryId))
      .orderBy(desc(tickets.lastActivity));
  }

  async getTicketsByReporter(reporterEmail: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.reporterEmail, reporterEmail))
      .orderBy(desc(tickets.createdAt));
  }

  // Categories
  async createTicketCategory(categoryData: InsertTicketCategory): Promise<TicketCategory> {
    const [category] = await db
      .insert(ticketCategories)
      .values(categoryData)
      .returning();
    return category;
  }

  async getTicketCategories(): Promise<TicketCategory[]> {
    return await db
      .select()
      .from(ticketCategories)
      .where(eq(ticketCategories.isActive, true))
      .orderBy(ticketCategories.name);
  }

  async getTicketCategoryById(id: number): Promise<TicketCategory | undefined> {
    const [category] = await db
      .select()
      .from(ticketCategories)
      .where(eq(ticketCategories.id, id));
    return category;
  }

  async updateTicketCategory(id: number, categoryData: Partial<InsertTicketCategory>): Promise<TicketCategory> {
    const [category] = await db
      .update(ticketCategories)
      .set({
        ...categoryData,
        updatedAt: new Date(),
      })
      .where(eq(ticketCategories.id, id))
      .returning();
    return category;
  }

  async deleteTicketCategory(id: number): Promise<void> {
    await db.delete(ticketCategories).where(eq(ticketCategories.id, id));
  }

  // Comments
  async createTicketComment(commentData: InsertTicketComment): Promise<TicketComment> {
    const [comment] = await db
      .insert(ticketComments)
      .values(commentData)
      .returning();
    
    // Update ticket last activity
    await db
      .update(tickets)
      .set({ lastActivity: new Date() })
      .where(eq(tickets.id, commentData.ticketId));
    
    return comment;
  }

  async getTicketComments(ticketId: number): Promise<TicketComment[]> {
    return await db
      .select()
      .from(ticketComments)
      .where(eq(ticketComments.ticketId, ticketId))
      .orderBy(ticketComments.createdAt);
  }

  async deleteTicketComment(id: number): Promise<void> {
    await db.delete(ticketComments).where(eq(ticketComments.id, id));
  }

  // Watchers
  async addTicketWatcher(watcherData: InsertTicketWatcher): Promise<TicketWatcher> {
    const [watcher] = await db
      .insert(ticketWatchers)
      .values(watcherData)
      .returning();
    return watcher;
  }

  async getTicketWatchers(ticketId: number): Promise<TicketWatcher[]> {
    return await db
      .select()
      .from(ticketWatchers)
      .where(eq(ticketWatchers.ticketId, ticketId));
  }

  async removeTicketWatcher(ticketId: number, watcherEmail: string): Promise<void> {
    await db
      .delete(ticketWatchers)
      .where(
        and(
          eq(ticketWatchers.ticketId, ticketId),
          eq(ticketWatchers.watcherEmail, watcherEmail)
        )
      );
  }

  // Settings
  async getTicketSettings(): Promise<TicketSettings | undefined> {
    const [settings] = await db.select().from(ticketSettings).limit(1);
    
    if (!settings) {
      // Create default settings if none exist
      const [defaultSettings] = await db
        .insert(ticketSettings)
        .values({
          adminNotificationEmail: "admin@momtazchem.com",
          autoAssignToAdmin: true,
          allowFileUploads: true,
          maxFileSize: 10,
          allowedFileTypes: ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
          ticketPrefix: "TKT",
          enableEmailNotifications: true,
        })
        .returning();
      return defaultSettings;
    }
    
    return settings;
  }

  async updateTicketSettings(settingsData: Partial<InsertTicketSettings>): Promise<TicketSettings> {
    const existingSettings = await this.getTicketSettings();
    
    if (existingSettings) {
      const [settings] = await db
        .update(ticketSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(ticketSettings.id, existingSettings.id))
        .returning();
      return settings;
    } else {
      const [settings] = await db
        .insert(ticketSettings)
        .values(settingsData)
        .returning();
      return settings;
    }
  }

  // Statistics
  async getTicketStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byCategory: Array<{ categoryName: string; count: number }>;
    byPriority: Array<{ priority: string; count: number }>;
    avgResolutionTime: number;
  }> {
    const totalTickets = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets);

    const statusCounts = await db
      .select({
        status: tickets.status,
        count: sql<number>`count(*)`
      })
      .from(tickets)
      .groupBy(tickets.status);

    const categoryCounts = await db
      .select({
        categoryName: ticketCategories.name,
        count: sql<number>`count(*)`
      })
      .from(tickets)
      .leftJoin(ticketCategories, eq(tickets.categoryId, ticketCategories.id))
      .groupBy(ticketCategories.name);

    const priorityCounts = await db
      .select({
        priority: tickets.priority,
        count: sql<number>`count(*)`
      })
      .from(tickets)
      .groupBy(tickets.priority);

    // Calculate average resolution time (in hours)
    const avgResolution = await db
      .select({
        avg: sql<number>`AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)`
      })
      .from(tickets)
      .where(eq(tickets.status, 'resolved'));

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: totalTickets[0]?.count || 0,
      open: statusMap['open'] || 0,
      inProgress: statusMap['in_progress'] || 0,
      resolved: statusMap['resolved'] || 0,
      closed: statusMap['closed'] || 0,
      byCategory: categoryCounts.filter(c => c.categoryName).map(c => ({
        categoryName: c.categoryName!,
        count: c.count
      })),
      byPriority: priorityCounts.map(p => ({
        priority: p.priority || 'medium',
        count: p.count
      })),
      avgResolutionTime: avgResolution[0]?.avg || 0,
    };
  }
}

export const ticketStorage = new TicketStorage();