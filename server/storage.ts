import { users, leads, leadActivities, passwordResets, type User, type InsertUser, type Lead, type InsertLead, type LeadActivity, type InsertLeadActivity, type PasswordReset, type InsertPasswordReset } from "@shared/schema";
import { contacts, showcaseProducts, type Contact, type InsertContact, type ShowcaseProduct, type InsertShowcaseProduct } from "@shared/showcase-schema";
import { db } from "./db";
import { showcaseDb } from "./showcase-db";
import { shopStorage } from "./shop-storage";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
  
  // Showcase Product management (for admin panel)
  createProduct(product: InsertShowcaseProduct): Promise<ShowcaseProduct>;
  getProducts(): Promise<ShowcaseProduct[]>;
  getProductById(id: number): Promise<ShowcaseProduct | undefined>;
  getProductsByCategory(category: string): Promise<ShowcaseProduct[]>;
  updateProduct(id: number, product: Partial<InsertShowcaseProduct>): Promise<ShowcaseProduct>;
  deleteProduct(id: number): Promise<void>;
  
  // Product synchronization with shop
  syncProductToShop(showcaseProduct: ShowcaseProduct): Promise<void>;
  syncAllProductsToShop(): Promise<void>;
  
  // User management
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  updateUserPassword(id: number, newPasswordHash: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  
  // Password reset functionality
  createPasswordReset(reset: InsertPasswordReset): Promise<PasswordReset>;
  getPasswordResetByToken(token: string): Promise<PasswordReset | undefined>;
  markPasswordResetAsUsed(token: string): Promise<void>;
  cleanupExpiredResets(): Promise<void>;
  
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
    const [contact] = await showcaseDb
      .insert(contacts)
      .values(insertContact)
      .returning();
    return contact;
  }

  async getContacts(): Promise<Contact[]> {
    return await showcaseDb.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  // Category helper method
  async getCategoryBySlug(slug: string): Promise<{ name: string; slug: string } | undefined> {
    // For showcase products, we'll use shop categories as the source of truth
    const category = await shopStorage.getCategoryBySlug(slug);
    return category ? { name: category.name, slug: category.slug } : undefined;
  }

  async getCategoryByName(name: string): Promise<{ name: string; slug: string } | undefined> {
    // For showcase products, we'll use shop categories as the source of truth
    const categories = await shopStorage.getCategories();
    const category = categories.find(cat => cat.name === name);
    return category ? { name: category.name, slug: category.slug } : undefined;
  }

  async createCategory(categoryData: { name: string; slug: string; description: string }): Promise<{ name: string; slug: string }> {
    // Create in shop categories since that's our source of truth
    const shopCategory = await shopStorage.createCategory({
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description,
    });
    return { name: shopCategory.name, slug: shopCategory.slug };
  }

  // Showcase Product management methods
  async createProduct(insertProduct: InsertShowcaseProduct): Promise<ShowcaseProduct> {
    // Validate that the category exists
    const categoryExists = await this.getCategoryBySlug(insertProduct.category);
    if (!categoryExists) {
      throw new Error(`Category '${insertProduct.category}' does not exist. Please create the category first.`);
    }

    // Map category slug to category name for proper storage
    const categoryName = categoryExists.name;

    // Ensure JSON fields are properly handled for PostgreSQL
    const productData = {
      ...insertProduct,
      category: categoryName, // Store the full category name
      unitPrice: String(insertProduct.unitPrice || 0), // Convert to string for decimal field
      specifications: insertProduct.specifications && typeof insertProduct.specifications === 'object' && !Array.isArray(insertProduct.specifications) && Object.keys(insertProduct.specifications).length > 0 ? insertProduct.specifications : null,
      features: (() => {
        if (Array.isArray(insertProduct.features)) {
          return insertProduct.features.length > 0 ? insertProduct.features : [];
        } else if (typeof insertProduct.features === 'string' && insertProduct.features.trim()) {
          return insertProduct.features.split('\n').map(f => f.trim()).filter(f => f.length > 0);
        }
        return [];
      })(),
      applications: (() => {
        if (Array.isArray(insertProduct.applications)) {
          return insertProduct.applications.length > 0 ? insertProduct.applications : [];
        } else if (typeof insertProduct.applications === 'string' && insertProduct.applications.trim()) {
          return insertProduct.applications.split('\n').map(a => a.trim()).filter(a => a.length > 0);
        }
        return [];
      })(),
      certifications: Array.isArray(insertProduct.certifications) && insertProduct.certifications.length > 0 ? insertProduct.certifications : null,
    };

    const [product] = await showcaseDb
      .insert(showcaseProducts)
      .values(productData)
      .returning();
    
    // Auto-sync to shop after creating showcase product
    await this.syncProductToShop(product);
    
    return product;
  }

  async getProducts(): Promise<ShowcaseProduct[]> {
    return await showcaseDb.select().from(showcaseProducts).orderBy(desc(showcaseProducts.createdAt));
  }

  async getProductById(id: number): Promise<ShowcaseProduct | undefined> {
    const [product] = await showcaseDb.select().from(showcaseProducts).where(eq(showcaseProducts.id, id));
    return product || undefined;
  }

  async getProductsByCategory(category: string): Promise<ShowcaseProduct[]> {
    return await showcaseDb.select().from(showcaseProducts).where(eq(showcaseProducts.category, category));
  }

  async updateProduct(id: number, productUpdate: Partial<InsertShowcaseProduct>): Promise<ShowcaseProduct> {
    // Skip category validation for updates - just accept the category as provided
    // This allows for flexible category management without strict validation

    // Ensure JSON fields are properly handled for PostgreSQL
    const updateData = {
      ...productUpdate,
      updatedAt: new Date(),
    };

    // Handle SKU field - set to null if empty to avoid unique constraint issues
    if (productUpdate.sku !== undefined) {
      updateData.sku = productUpdate.sku && productUpdate.sku.trim() ? productUpdate.sku.trim() : null;
    }

    // Handle barcode field - set to null if empty
    if (productUpdate.barcode !== undefined) {
      updateData.barcode = productUpdate.barcode && productUpdate.barcode.trim() ? productUpdate.barcode.trim() : null;
    }

    // Handle unitPrice field - convert number to string for decimal field
    if (productUpdate.unitPrice !== undefined) {
      updateData.unitPrice = String(productUpdate.unitPrice);
    }

    // Handle JSON fields properly - use null for empty arrays/objects
    if (productUpdate.specifications !== undefined) {
      if (typeof productUpdate.specifications === 'string' && productUpdate.specifications.trim()) {
        // If it's a non-empty string, keep it as string
        updateData.specifications = productUpdate.specifications.trim();
      } else if (typeof productUpdate.specifications === 'object' && productUpdate.specifications !== null && !Array.isArray(productUpdate.specifications) && Object.keys(productUpdate.specifications).length > 0) {
        // If it's a valid object with properties, keep it
        updateData.specifications = productUpdate.specifications;
      } else {
        // Otherwise set to null
        updateData.specifications = null;
      }
    }
    if (productUpdate.features !== undefined) {
      if (Array.isArray(productUpdate.features)) {
        updateData.features = productUpdate.features.length > 0 ? productUpdate.features : [];
      } else if (typeof productUpdate.features === 'string' && productUpdate.features.trim()) {
        updateData.features = productUpdate.features.split('\n').map(f => f.trim()).filter(f => f.length > 0);
      } else {
        updateData.features = [];
      }
    }
    if (productUpdate.applications !== undefined) {
      if (Array.isArray(productUpdate.applications)) {
        updateData.applications = productUpdate.applications.length > 0 ? productUpdate.applications : [];
      } else if (typeof productUpdate.applications === 'string' && productUpdate.applications.trim()) {
        updateData.applications = productUpdate.applications.split('\n').map(a => a.trim()).filter(a => a.length > 0);
      } else {
        updateData.applications = [];
      }
    }
    if (productUpdate.certifications !== undefined) {
      updateData.certifications = Array.isArray(productUpdate.certifications) && productUpdate.certifications.length > 0 ? productUpdate.certifications : null;
    }

    const [product] = await showcaseDb
      .update(showcaseProducts)
      .set(updateData)
      .where(eq(showcaseProducts.id, id))
      .returning();
    
    // Auto-sync to shop after updating showcase product
    await this.syncProductToShop(product);
    
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await showcaseDb.delete(showcaseProducts).where(eq(showcaseProducts.id, id));
  }

  // Product synchronization methods
  async syncProductToShop(showcaseProduct: ShowcaseProduct): Promise<void> {
    try {
      // Generate SKU from name if not available
      const productSku = `SP-${showcaseProduct.id}-${showcaseProduct.name.replace(/\s+/g, '-').toUpperCase().substring(0, 10)}`;
      
      // Check if product already exists in shop by name (since showcase doesn't have SKU)
      const allShopProducts = await shopStorage.getShopProducts();
      const existingShopProduct = allShopProducts.find(p => p.name === showcaseProduct.name);
      
      // Extract price from unitPrice first, fallback to priceRange
      let productPrice = "50"; // Default price
      if (showcaseProduct.unitPrice && showcaseProduct.unitPrice > 0) {
        productPrice = showcaseProduct.unitPrice.toString();
      } else if (showcaseProduct.priceRange) {
        const priceMatch = showcaseProduct.priceRange.match(/\$?(\d+(?:\.\d+)?)/);
        if (priceMatch) {
          productPrice = priceMatch[1];
        }
      }
      
      if (existingShopProduct) {
        // Update existing shop product with real inventory data
        await shopStorage.updateShopProduct(existingShopProduct.id, {
          name: showcaseProduct.name,
          description: showcaseProduct.description,
          price: productPrice,
          category: showcaseProduct.category,
          stockQuantity: showcaseProduct.stockQuantity || 0,
          lowStockThreshold: showcaseProduct.minStockLevel || 10,
          imageUrls: showcaseProduct.imageUrl ? [showcaseProduct.imageUrl] : null,
          thumbnailUrl: showcaseProduct.imageUrl || null,
          isActive: showcaseProduct.isActive,
        });
      } else {
        // Create new shop product with real inventory data
        await shopStorage.createShopProduct({
          name: showcaseProduct.name,
          sku: productSku,
          description: showcaseProduct.description || '',
          price: productPrice,
          priceUnit: 'unit',
          category: showcaseProduct.category,
          stockQuantity: showcaseProduct.stockQuantity || 0,
          lowStockThreshold: showcaseProduct.minStockLevel || 10,
          imageUrls: showcaseProduct.imageUrl ? [showcaseProduct.imageUrl] : null,
          thumbnailUrl: showcaseProduct.imageUrl || null,
          isActive: showcaseProduct.isActive,
          isFeatured: false,
        });
      }
    } catch (error) {
      console.error('Error syncing product to shop:', error);
    }
  }

  async syncAllProductsToShop(): Promise<void> {
    try {
      const showcaseProducts = await this.getProducts();
      for (const product of showcaseProducts) {
        await this.syncProductToShop(product);
      }
    } catch (error) {
      console.error('Error syncing all products to shop:', error);
    }
  }

  // Reverse sync: Update showcase product stock from shop product stock
  async syncStockFromShop(shopProductId: number, newStockQuantity: number): Promise<void> {
    try {
      const shopProduct = await shopStorage.getShopProductById(shopProductId);
      if (!shopProduct) return;

      const showcaseProducts = await this.getProducts();
      const matchingShowcaseProduct = showcaseProducts.find(sp => sp.name === shopProduct.name);
      
      if (matchingShowcaseProduct) {
        await this.updateProduct(matchingShowcaseProduct.id, {
          stockQuantity: newStockQuantity
        });
      }
    } catch (error) {
      console.error('Error syncing stock from shop to showcase:', error);
    }
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
    // Check by both username and email to handle login flexibility
    const [user] = await db.select().from(users).where(
      or(
        eq(users.username, username),
        eq(users.email, username)
      )
    );
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userUpdate, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: number, newPasswordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Password reset methods
  async createPasswordReset(resetData: InsertPasswordReset): Promise<PasswordReset> {
    const [reset] = await db
      .insert(passwordResets)
      .values(resetData)
      .returning();
    return reset;
  }

  async getPasswordResetByToken(token: string): Promise<PasswordReset | undefined> {
    const [reset] = await db
      .select()
      .from(passwordResets)
      .where(and(
        eq(passwordResets.token, token),
        eq(passwordResets.used, false)
      ));
    return reset || undefined;
  }

  async markPasswordResetAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResets)
      .set({ used: true })
      .where(eq(passwordResets.token, token));
  }

  async cleanupExpiredResets(): Promise<void> {
    await db
      .delete(passwordResets)
      .where(sql`expires_at < NOW()`);
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
