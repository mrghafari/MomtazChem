import { db } from "./db";
import { customerCommunications, emailCategories, CustomerCommunication, InsertCustomerCommunication } from "@shared/email-schema";
import { eq, desc, and, or } from "drizzle-orm";

export class CustomerCommunicationStorage {
  // Send a new message to customer
  async sendMessage(data: InsertCustomerCommunication): Promise<CustomerCommunication> {
    const [communication] = await db
      .insert(customerCommunications)
      .values(data)
      .returning();
    
    return communication;
  }

  // Get all communications for a specific category
  async getCommunicationsByCategory(categoryId: number): Promise<CustomerCommunication[]> {
    return await db
      .select()
      .from(customerCommunications)
      .where(eq(customerCommunications.categoryId, categoryId))
      .orderBy(desc(customerCommunications.createdAt));
  }

  // Get all communications with a specific customer
  async getCommunicationsByCustomer(customerEmail: string): Promise<CustomerCommunication[]> {
    return await db
      .select()
      .from(customerCommunications)
      .where(eq(customerCommunications.customerEmail, customerEmail))
      .orderBy(desc(customerCommunications.createdAt));
  }

  // Get communication thread (message and its replies)
  async getCommunicationThread(messageId: number): Promise<CustomerCommunication[]> {
    return await db
      .select()
      .from(customerCommunications)
      .where(
        or(
          eq(customerCommunications.id, messageId),
          eq(customerCommunications.replyToMessageId, messageId)
        )
      )
      .orderBy(customerCommunications.createdAt);
  }

  // Mark message as read
  async markAsRead(messageId: number): Promise<void> {
    await db
      .update(customerCommunications)
      .set({ 
        readAt: new Date(),
        status: 'read'
      })
      .where(eq(customerCommunications.id, messageId));
  }

  // Mark message as replied
  async markAsReplied(messageId: number): Promise<void> {
    await db
      .update(customerCommunications)
      .set({ 
        repliedAt: new Date(),
        status: 'replied'
      })
      .where(eq(customerCommunications.id, messageId));
  }

  // Get recent communications (last 30 days)
  async getRecentCommunications(limit: number = 50): Promise<CustomerCommunication[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await db
      .select()
      .from(customerCommunications)
      .where(eq(customerCommunications.createdAt, thirtyDaysAgo))
      .orderBy(desc(customerCommunications.createdAt))
      .limit(limit);
  }

  // Get communication stats by category
  async getCommunicationStats(categoryId?: number) {
    let query = db.select().from(customerCommunications);
    
    if (categoryId) {
      query = query.where(eq(customerCommunications.categoryId, categoryId));
    }

    const communications = await query;

    const stats = {
      total: communications.length,
      sent: communications.filter(c => c.messageType === 'outbound').length,
      received: communications.filter(c => c.messageType === 'inbound').length,
      followUps: communications.filter(c => c.messageType === 'follow_up').length,
      replied: communications.filter(c => c.status === 'replied').length,
      pending: communications.filter(c => c.status === 'sent' || c.status === 'delivered').length,
    };

    return stats;
  }

  // Search communications by customer name or email
  async searchCommunications(searchTerm: string): Promise<CustomerCommunication[]> {
    return await db
      .select()
      .from(customerCommunications)
      .where(
        or(
          eq(customerCommunications.customerEmail, searchTerm),
          eq(customerCommunications.customerName, searchTerm),
          eq(customerCommunications.subject, searchTerm)
        )
      )
      .orderBy(desc(customerCommunications.createdAt));
  }

  // Update communication status
  async updateStatus(messageId: number, status: string): Promise<void> {
    await db
      .update(customerCommunications)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(customerCommunications.id, messageId));
  }

  // Delete communication
  async deleteCommunication(messageId: number): Promise<void> {
    await db
      .delete(customerCommunications)
      .where(eq(customerCommunications.id, messageId));
  }

  // Get communication by ID
  async getCommunicationById(messageId: number): Promise<CustomerCommunication | undefined> {
    const [communication] = await db
      .select()
      .from(customerCommunications)
      .where(eq(customerCommunications.id, messageId))
      .limit(1);
    
    return communication;
  }
}

export const customerCommunicationStorage = new CustomerCommunicationStorage();