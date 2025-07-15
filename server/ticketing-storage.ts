import { db } from "./db";
import { 
  supportTickets, 
  ticketResponses, 
  ticketStatusHistory, 
  ticketCategories,
  ticketAssignments,
  type SupportTicket, 
  type InsertSupportTicket,
  type TicketResponse,
  type InsertTicketResponse,
  type TicketStatusHistory,
  type InsertTicketStatusHistory,
  type TicketCategory,
  type InsertTicketCategory,
  type TicketAssignment,
  type InsertTicketAssignment,
  type TicketStatus
} from "@shared/ticketing-schema";
import { eq, desc, and, or, sql, count } from "drizzle-orm";

export interface ITicketingStorage {
  // Ticket Management
  createTicket(ticketData: InsertSupportTicket): Promise<SupportTicket>;
  getTicketById(id: number): Promise<SupportTicket | undefined>;
  getTicketByNumber(ticketNumber: string): Promise<SupportTicket | undefined>;
  updateTicket(id: number, ticketData: Partial<InsertSupportTicket>): Promise<SupportTicket>;
  deleteTicket(id: number): Promise<void>;
  
  // Ticket Listing and Filtering
  getTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: number;
    submittedBy?: number;
    limit?: number;
    offset?: number;
  }): Promise<SupportTicket[]>;
  
  getTicketsByUser(userId: number, limit?: number, offset?: number): Promise<SupportTicket[]>;
  getAssignedTickets(adminId: number, limit?: number, offset?: number): Promise<SupportTicket[]>;
  
  // Ticket Responses
  createTicketResponse(responseData: InsertTicketResponse): Promise<TicketResponse>;
  getTicketResponses(ticketId: number): Promise<TicketResponse[]>;
  markResponseAsRead(responseId: number): Promise<void>;
  
  // Status Management
  updateTicketStatus(
    ticketId: number, 
    newStatus: TicketStatus, 
    changedBy: number, 
    changedByName: string, 
    changedByType: 'admin' | 'site_manager',
    reason?: string
  ): Promise<void>;
  
  getTicketStatusHistory(ticketId: number): Promise<TicketStatusHistory[]>;
  
  // Assignment Management
  assignTicket(ticketId: number, adminId: number, assignedBy: number, notes?: string): Promise<TicketAssignment>;
  unassignTicket(ticketId: number): Promise<void>;
  getTicketAssignments(ticketId: number): Promise<TicketAssignment[]>;
  
  // Categories
  getTicketCategories(): Promise<TicketCategory[]>;
  createTicketCategory(categoryData: InsertTicketCategory): Promise<TicketCategory>;
  updateTicketCategory(id: number, categoryData: Partial<InsertTicketCategory>): Promise<TicketCategory>;
  
  // Statistics and Analytics
  getTicketStats(): Promise<{
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    urgentTickets: number;
    averageResolutionTime: number; // in hours
    ticketsByCategory: Array<{ category: string; count: number; }>;
    ticketsByPriority: Array<{ priority: string; count: number; }>;
  }>;
  
  getUserTicketStats(userId: number): Promise<{
    totalSubmitted: number;
    openTickets: number;
    resolvedTickets: number;
    averageResolutionTime: number;
  }>;
  
  // Search and Filters
  searchTickets(query: string, filters?: any): Promise<SupportTicket[]>;
  
  // Bulk Operations
  bulkUpdateTicketStatus(ticketIds: number[], newStatus: TicketStatus, adminId: number): Promise<void>;
  bulkAssignTickets(ticketIds: number[], adminId: number, assignedBy: number): Promise<void>;
}

export class TicketingStorage implements ITicketingStorage {
  
  private generateTicketNumber(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `TKT-${year}-${timestamp}`;
  }

  async createTicket(ticketData: InsertSupportTicket): Promise<SupportTicket> {
    const ticketNumber = this.generateTicketNumber();
    
    const [ticket] = await db.insert(supportTickets).values({
      ...ticketData,
      ticketNumber,
    }).returning();
    
    // Create initial status history entry
    await this.createStatusHistoryEntry(
      ticket.id,
      null,
      'open',
      ticketData.submittedBy,
      ticketData.submitterName,
      'site_manager',
      'Ticket created'
    );
    
    return ticket;
  }

  async getTicketById(id: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket;
  }

  async getTicketByNumber(ticketNumber: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.ticketNumber, ticketNumber));
    return ticket;
  }

  async updateTicket(id: number, ticketData: Partial<InsertSupportTicket>): Promise<SupportTicket> {
    const [ticket] = await db.update(supportTickets)
      .set({
        ...ticketData,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, id))
      .returning();
    return ticket;
  }

  async deleteTicket(id: number): Promise<void> {
    await db.delete(supportTickets).where(eq(supportTickets.id, id));
  }

  async getTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: number;
    submittedBy?: number;
    limit?: number;
    offset?: number;
  }): Promise<SupportTicket[]> {
    let query = db.select().from(supportTickets);
    
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(supportTickets.status, filters.status));
    }
    
    if (filters?.priority) {
      conditions.push(eq(supportTickets.priority, filters.priority));
    }
    
    if (filters?.category) {
      conditions.push(eq(supportTickets.category, filters.category));
    }
    
    if (filters?.assignedTo) {
      conditions.push(eq(supportTickets.assignedTo, filters.assignedTo));
    }
    
    if (filters?.submittedBy) {
      conditions.push(eq(supportTickets.submittedBy, filters.submittedBy));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(supportTickets.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async getTicketsByUser(userId: number, limit: number = 50, offset: number = 0): Promise<SupportTicket[]> {
    return await db.select()
      .from(supportTickets)
      .where(eq(supportTickets.submittedBy, userId))
      .orderBy(desc(supportTickets.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getTicketsByCustomUser(customUserId: string, limit: number = 50, offset: number = 0): Promise<SupportTicket[]> {
    return await db.select()
      .from(supportTickets)
      .where(eq(supportTickets.customerUserId, customUserId))
      .orderBy(desc(supportTickets.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getAssignedTickets(adminId: number, limit: number = 50, offset: number = 0): Promise<SupportTicket[]> {
    return await db.select()
      .from(supportTickets)
      .where(eq(supportTickets.assignedTo, adminId))
      .orderBy(desc(supportTickets.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createTicketResponse(responseData: InsertTicketResponse): Promise<TicketResponse> {
    const [response] = await db.insert(ticketResponses).values(responseData).returning();
    
    // Update ticket's updatedAt timestamp
    await db.update(supportTickets)
      .set({ updatedAt: new Date() })
      .where(eq(supportTickets.id, responseData.ticketId));
    
    return response;
  }

  async getTicketResponses(ticketId: number): Promise<TicketResponse[]> {
    return await db.select()
      .from(ticketResponses)
      .where(eq(ticketResponses.ticketId, ticketId))
      .orderBy(ticketResponses.createdAt);
  }

  async markResponseAsRead(responseId: number): Promise<void> {
    await db.update(ticketResponses)
      .set({ readAt: new Date() })
      .where(eq(ticketResponses.id, responseId));
  }

  private async createStatusHistoryEntry(
    ticketId: number,
    oldStatus: string | null,
    newStatus: string,
    changedBy: number,
    changedByName: string,
    changedByType: 'admin' | 'site_manager',
    reason?: string
  ): Promise<void> {
    await db.insert(ticketStatusHistory).values({
      ticketId,
      oldStatus,
      newStatus,
      changedBy,
      changedByName,
      changedByType,
      reason,
    });
  }

  async updateTicketStatus(
    ticketId: number,
    newStatus: TicketStatus,
    changedBy: number,
    changedByName: string,
    changedByType: 'admin' | 'site_manager',
    reason?: string
  ): Promise<void> {
    // Get current ticket to record old status
    const currentTicket = await this.getTicketById(ticketId);
    const oldStatus = currentTicket?.status;
    
    // Update ticket status
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    };
    
    // Set resolution/closure timestamps
    if (newStatus === 'resolved') {
      updateData.resolvedAt = new Date();
      if (!currentTicket?.actualResolution) {
        updateData.actualResolution = new Date();
      }
    } else if (newStatus === 'closed') {
      updateData.closedAt = new Date();
      if (!currentTicket?.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
      if (!currentTicket?.actualResolution) {
        updateData.actualResolution = new Date();
      }
    }
    
    await db.update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, ticketId));
    
    // Create status history entry
    await this.createStatusHistoryEntry(
      ticketId,
      oldStatus || null,
      newStatus,
      changedBy,
      changedByName,
      changedByType,
      reason
    );
  }

  async getTicketStatusHistory(ticketId: number): Promise<TicketStatusHistory[]> {
    return await db.select()
      .from(ticketStatusHistory)
      .where(eq(ticketStatusHistory.ticketId, ticketId))
      .orderBy(ticketStatusHistory.createdAt);
  }

  async assignTicket(ticketId: number, adminId: number, assignedBy: number, notes?: string): Promise<TicketAssignment> {
    // Deactivate any existing assignments
    await db.update(ticketAssignments)
      .set({ isActive: false })
      .where(eq(ticketAssignments.ticketId, ticketId));
    
    // Create new assignment
    const [assignment] = await db.insert(ticketAssignments).values({
      ticketId,
      assignedTo: adminId,
      assignedBy,
      notes,
    }).returning();
    
    // Update ticket assignedTo field
    await db.update(supportTickets)
      .set({ 
        assignedTo: adminId,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId));
    
    return assignment;
  }

  async unassignTicket(ticketId: number): Promise<void> {
    // Deactivate assignments
    await db.update(ticketAssignments)
      .set({ isActive: false })
      .where(eq(ticketAssignments.ticketId, ticketId));
    
    // Clear assignedTo field
    await db.update(supportTickets)
      .set({ 
        assignedTo: null,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId));
  }

  async getTicketAssignments(ticketId: number): Promise<TicketAssignment[]> {
    return await db.select()
      .from(ticketAssignments)
      .where(eq(ticketAssignments.ticketId, ticketId))
      .orderBy(desc(ticketAssignments.assignedAt));
  }

  async getTicketCategories(): Promise<TicketCategory[]> {
    return await db.select()
      .from(ticketCategories)
      .where(eq(ticketCategories.isActive, true))
      .orderBy(ticketCategories.sortOrder, ticketCategories.name);
  }

  async createTicketCategory(categoryData: InsertTicketCategory): Promise<TicketCategory> {
    const [category] = await db.insert(ticketCategories).values(categoryData).returning();
    return category;
  }

  async updateTicketCategory(id: number, categoryData: Partial<InsertTicketCategory>): Promise<TicketCategory> {
    const [category] = await db.update(ticketCategories)
      .set(categoryData)
      .where(eq(ticketCategories.id, id))
      .returning();
    return category;
  }

  async getTicketStats(): Promise<{
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    urgentTickets: number;
    averageResolutionTime: number;
    ticketsByCategory: Array<{ category: string; count: number; }>;
    ticketsByPriority: Array<{ priority: string; count: number; }>;
  }> {
    // Get basic counts
    const [stats] = await db.select({
      totalTickets: count(),
      openTickets: sql<number>`SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)`,
      inProgressTickets: sql<number>`SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)`,
      resolvedTickets: sql<number>`SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)`,
      closedTickets: sql<number>`SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END)`,
      urgentTickets: sql<number>`SUM(CASE WHEN priority IN ('urgent', 'critical') THEN 1 ELSE 0 END)`,
    }).from(supportTickets);
    
    // Calculate average resolution time (in hours)
    const [resolutionTime] = await db.select({
      avgHours: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600), 0)`,
    }).from(supportTickets).where(eq(supportTickets.status, 'resolved'));
    
    // Get tickets by category
    const categoryStats = await db.select({
      category: supportTickets.category,
      count: count(),
    }).from(supportTickets).groupBy(supportTickets.category);
    
    // Get tickets by priority
    const priorityStats = await db.select({
      priority: supportTickets.priority,
      count: count(),
    }).from(supportTickets).groupBy(supportTickets.priority);
    
    return {
      totalTickets: stats.totalTickets,
      openTickets: Number(stats.openTickets) || 0,
      inProgressTickets: Number(stats.inProgressTickets) || 0,
      resolvedTickets: Number(stats.resolvedTickets) || 0,
      closedTickets: Number(stats.closedTickets) || 0,
      urgentTickets: Number(stats.urgentTickets) || 0,
      averageResolutionTime: Number(resolutionTime.avgHours) || 0,
      ticketsByCategory: categoryStats.map(stat => ({
        category: stat.category || 'unknown',
        count: stat.count,
      })),
      ticketsByPriority: priorityStats.map(stat => ({
        priority: stat.priority,
        count: stat.count,
      })),
    };
  }

  async getUserTicketStats(userId: number): Promise<{
    totalSubmitted: number;
    openTickets: number;
    resolvedTickets: number;
    averageResolutionTime: number;
  }> {
    const [stats] = await db.select({
      totalSubmitted: count(),
      openTickets: sql<number>`SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)`,
      resolvedTickets: sql<number>`SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)`,
    }).from(supportTickets).where(eq(supportTickets.submittedBy, userId));
    
    const [resolutionTime] = await db.select({
      avgHours: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600), 0)`,
    }).from(supportTickets)
      .where(and(
        eq(supportTickets.submittedBy, userId),
        eq(supportTickets.status, 'resolved')
      ));
    
    return {
      totalSubmitted: stats.totalSubmitted,
      openTickets: Number(stats.openTickets) || 0,
      resolvedTickets: Number(stats.resolvedTickets) || 0,
      averageResolutionTime: Number(resolutionTime.avgHours) || 0,
    };
  }

  async searchTickets(query: string, filters?: any): Promise<SupportTicket[]> {
    const searchConditions = or(
      sql`${supportTickets.title} ILIKE ${`%${query}%`}`,
      sql`${supportTickets.description} ILIKE ${`%${query}%`}`,
      sql`${supportTickets.ticketNumber} ILIKE ${`%${query}%`}`,
      sql`${supportTickets.submitterName} ILIKE ${`%${query}%`}`
    );
    
    let queryBuilder = db.select()
      .from(supportTickets)
      .where(searchConditions);
    
    // Apply additional filters if provided
    if (filters?.status) {
      queryBuilder = queryBuilder.where(
        and(searchConditions, eq(supportTickets.status, filters.status))
      );
    }
    
    return await queryBuilder.orderBy(desc(supportTickets.createdAt));
  }

  async bulkUpdateTicketStatus(ticketIds: number[], newStatus: TicketStatus, adminId: number): Promise<void> {
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    };
    
    if (newStatus === 'resolved') {
      updateData.resolvedAt = new Date();
    } else if (newStatus === 'closed') {
      updateData.closedAt = new Date();
    }
    
    await db.update(supportTickets)
      .set(updateData)
      .where(sql`${supportTickets.id} = ANY(${ticketIds})`);
  }

  async bulkAssignTickets(ticketIds: number[], adminId: number, assignedBy: number): Promise<void> {
    await db.update(supportTickets)
      .set({
        assignedTo: adminId,
        updatedAt: new Date(),
      })
      .where(sql`${supportTickets.id} = ANY(${ticketIds})`);
    
    // Create assignment records
    const assignmentData = ticketIds.map(ticketId => ({
      ticketId,
      assignedTo: adminId,
      assignedBy,
    }));
    
    await db.insert(ticketAssignments).values(assignmentData);
  }
}

export const ticketingStorage = new TicketingStorage();