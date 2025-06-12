import { contacts, products, users, leads, leadActivities, type Contact, type InsertContact, type Product, type InsertProduct, type User, type InsertUser, type Lead, type InsertLead, type LeadActivity, type InsertLeadActivity } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
  
  // Product management
  createProduct(product: InsertProduct): Promise<Product>;
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // User management
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  
  // CRM Lead management
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(filters?: { status?: string; priority?: string; assignedTo?: number; search?: string }): Promise<Lead[]>;
  getLeadById(id: number): Promise<Lead | undefined>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: number): Promise<void>;
  convertContactToLead(contactId: number, additionalData?: Partial<InsertLead>): Promise<Lead>;
  
  // Lead activity management
  createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity>;
  getLeadActivities(leadId: number): Promise<LeadActivity[]>;
  updateLeadActivity(id: number, activity: Partial<InsertLeadActivity>): Promise<LeadActivity>;
  deleteLeadActivity(id: number): Promise<void>;
  
  // CRM Analytics
  getLeadStatistics(): Promise<{
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    closedWon: number;
    closedLost: number;
    conversionRate: number;
    averageDealSize: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(insertContact)
      .returning();
    return contact;
  }

  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  // Product management methods
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.category, category));
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...productUpdate, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // User management methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  // CRM Lead management methods
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values(insertLead)
      .returning();
    return lead;
  }

  async getLeads(filters?: { status?: string; priority?: string; assignedTo?: number; search?: string }): Promise<Lead[]> {
    let query = db.select().from(leads);
    
    if (filters) {
      const conditions = [];
      
      if (filters.status) {
        conditions.push(eq(leads.status, filters.status));
      }
      
      if (filters.priority) {
        conditions.push(eq(leads.priority, filters.priority));
      }
      
      if (filters.assignedTo) {
        conditions.push(eq(leads.assignedTo, filters.assignedTo));
      }
      
      if (filters.search) {
        conditions.push(
          or(
            like(leads.firstName, `%${filters.search}%`),
            like(leads.lastName, `%${filters.search}%`),
            like(leads.email, `%${filters.search}%`),
            like(leads.company, `%${filters.search}%`)
          )
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }
    }
    
    return await query.orderBy(desc(leads.updatedAt));
  }

  async getLeadById(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async updateLead(id: number, leadUpdate: Partial<InsertLead>): Promise<Lead> {
    const [lead] = await db
      .update(leads)
      .set({ ...leadUpdate, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async deleteLead(id: number): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  async convertContactToLead(contactId: number, additionalData?: Partial<InsertLead>): Promise<Lead> {
    const contact = await this.getContactById(contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    const leadData: InsertLead = {
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: "",
      company: contact.company,
      leadSource: "contact_form",
      status: "new",
      priority: "medium",
      productInterest: contact.productInterest,
      notes: `Converted from contact form. Original message: ${contact.message}`,
      ...additionalData
    };

    return await this.createLead(leadData);
  }

  // Lead activity management methods
  async createLeadActivity(insertActivity: InsertLeadActivity): Promise<LeadActivity> {
    const [activity] = await db
      .insert(leadActivities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getLeadActivities(leadId: number): Promise<LeadActivity[]> {
    return await db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt));
  }

  async updateLeadActivity(id: number, activityUpdate: Partial<InsertLeadActivity>): Promise<LeadActivity> {
    const [activity] = await db
      .update(leadActivities)
      .set(activityUpdate)
      .where(eq(leadActivities.id, id))
      .returning();
    return activity;
  }

  async deleteLeadActivity(id: number): Promise<void> {
    await db.delete(leadActivities).where(eq(leadActivities.id, id));
  }

  // CRM Analytics
  async getLeadStatistics(): Promise<{
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    closedWon: number;
    closedLost: number;
    conversionRate: number;
    averageDealSize: number;
  }> {
    const stats = await db
      .select({
        total: sql<number>`count(*)`,
        new: sql<number>`sum(case when status = 'new' then 1 else 0 end)`,
        qualified: sql<number>`sum(case when status = 'qualified' then 1 else 0 end)`,
        closedWon: sql<number>`sum(case when status = 'closed_won' then 1 else 0 end)`,
        closedLost: sql<number>`sum(case when status = 'closed_lost' then 1 else 0 end)`,
        avgDealSize: sql<number>`avg(case when estimated_value is not null then estimated_value else 0 end)`,
      })
      .from(leads);

    const result = stats[0];
    const totalClosed = result.closedWon + result.closedLost;
    const conversionRate = totalClosed > 0 ? (result.closedWon / totalClosed) * 100 : 0;

    return {
      totalLeads: result.total,
      newLeads: result.new,
      qualifiedLeads: result.qualified,
      closedWon: result.closedWon,
      closedLost: result.closedLost,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageDealSize: Math.round(result.avgDealSize * 100) / 100,
    };
  }

  // Helper method for contact conversion
  private async getContactById(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }
}

export const storage = new DatabaseStorage();
