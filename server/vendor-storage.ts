import {
  vendors,
  vendorUsers,
  showcaseProducts,
  shopProducts,
  type Vendor,
  type InsertVendor,
  type VendorUser,
  type InsertVendorUser,
  type ShowcaseProduct,
  type ShopProduct
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql, count } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IVendorStorage {
  // Vendor management
  getVendors(): Promise<Vendor[]>;
  getActiveVendors(): Promise<Vendor[]>;
  getApprovedVendors(): Promise<Vendor[]>;
  getPendingVendors(): Promise<Vendor[]>;
  getVendorById(id: number): Promise<Vendor | undefined>;
  getVendorByEmail(email: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor>;
  deleteVendor(id: number): Promise<void>;
  approveVendor(id: number, approvedBy: number): Promise<Vendor>;
  rejectVendor(id: number, reason: string): Promise<Vendor>;
  updateVendorStats(vendorId: number): Promise<void>;
  
  // Vendor user management
  getVendorUsers(vendorId: number): Promise<VendorUser[]>;
  getVendorUserById(id: number): Promise<VendorUser | undefined>;
  getVendorUserByUsername(username: string): Promise<VendorUser | undefined>;
  getVendorUserByEmail(email: string): Promise<VendorUser | undefined>;
  createVendorUser(user: InsertVendorUser): Promise<VendorUser>;
  updateVendorUser(id: number, user: Partial<InsertVendorUser>): Promise<VendorUser>;
  deleteVendorUser(id: number): Promise<void>;
  verifyVendorUserPassword(username: string, password: string): Promise<VendorUser | null>;
  updateVendorUserLoginInfo(userId: number, ip: string): Promise<void>;
  incrementFailedLoginAttempts(userId: number): Promise<void>;
  resetFailedLoginAttempts(userId: number): Promise<void>;
  lockVendorUser(userId: number, durationMinutes: number): Promise<void>;
  
  // Vendor products management
  getVendorShowcaseProducts(vendorId: number): Promise<ShowcaseProduct[]>;
  getVendorShopProducts(vendorId: number): Promise<ShopProduct[]>;
  getVendorProductCount(vendorId: number): Promise<number>;
  searchVendorProducts(vendorId: number, query: string): Promise<{
    showcaseProducts: ShowcaseProduct[];
    shopProducts: ShopProduct[];
  }>;
}

export class VendorStorage implements IVendorStorage {
  // ============================================================================
  // VENDOR MANAGEMENT
  // ============================================================================
  
  async getVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).orderBy(desc(vendors.createdAt));
  }
  
  async getActiveVendors(): Promise<Vendor[]> {
    return await db
      .select()
      .from(vendors)
      .where(eq(vendors.isActive, true))
      .orderBy(desc(vendors.createdAt));
  }
  
  async getApprovedVendors(): Promise<Vendor[]> {
    return await db
      .select()
      .from(vendors)
      .where(and(
        eq(vendors.isActive, true),
        eq(vendors.isApproved, true)
      ))
      .orderBy(desc(vendors.createdAt));
  }
  
  async getPendingVendors(): Promise<Vendor[]> {
    return await db
      .select()
      .from(vendors)
      .where(eq(vendors.isApproved, false))
      .orderBy(desc(vendors.createdAt));
  }
  
  async getVendorById(id: number): Promise<Vendor | undefined> {
    const result = await db.select().from(vendors).where(eq(vendors.id, id));
    return result[0];
  }
  
  async getVendorByEmail(email: string): Promise<Vendor | undefined> {
    const result = await db
      .select()
      .from(vendors)
      .where(eq(vendors.contactEmail, email));
    return result[0];
  }
  
  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const result = await db.insert(vendors).values(vendor).returning();
    return result[0];
  }
  
  async updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor> {
    const result = await db
      .update(vendors)
      .set({
        ...vendor,
        updatedAt: new Date()
      })
      .where(eq(vendors.id, id))
      .returning();
    return result[0];
  }
  
  async deleteVendor(id: number): Promise<void> {
    await db.delete(vendors).where(eq(vendors.id, id));
  }
  
  async approveVendor(id: number, approvedBy: number): Promise<Vendor> {
    const result = await db
      .update(vendors)
      .set({
        isApproved: true,
        isActive: true,
        approvedBy,
        approvedAt: new Date(),
        rejectionReason: null,
        updatedAt: new Date()
      })
      .where(eq(vendors.id, id))
      .returning();
    return result[0];
  }
  
  async rejectVendor(id: number, reason: string): Promise<Vendor> {
    const result = await db
      .update(vendors)
      .set({
        isApproved: false,
        isActive: false,
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(vendors.id, id))
      .returning();
    return result[0];
  }
  
  async updateVendorStats(vendorId: number): Promise<void> {
    // Count total products for this vendor
    const showcaseCount = await db
      .select({ count: count() })
      .from(showcaseProducts)
      .where(eq(showcaseProducts.vendorId, vendorId));
    
    const shopCount = await db
      .select({ count: count() })
      .from(shopProducts)
      .where(eq(shopProducts.vendorId, vendorId));
    
    const totalProducts = (showcaseCount[0]?.count || 0) + (shopCount[0]?.count || 0);
    
    // Update vendor stats
    await db
      .update(vendors)
      .set({
        totalProducts,
        updatedAt: new Date()
      })
      .where(eq(vendors.id, vendorId));
  }
  
  // ============================================================================
  // VENDOR USER MANAGEMENT
  // ============================================================================
  
  async getVendorUsers(vendorId: number): Promise<VendorUser[]> {
    return await db
      .select()
      .from(vendorUsers)
      .where(eq(vendorUsers.vendorId, vendorId))
      .orderBy(desc(vendorUsers.createdAt));
  }
  
  async getVendorUserById(id: number): Promise<VendorUser | undefined> {
    const result = await db
      .select()
      .from(vendorUsers)
      .where(eq(vendorUsers.id, id));
    return result[0];
  }
  
  async getVendorUserByUsername(username: string): Promise<VendorUser | undefined> {
    const result = await db
      .select()
      .from(vendorUsers)
      .where(eq(vendorUsers.username, username));
    return result[0];
  }
  
  async getVendorUserByEmail(email: string): Promise<VendorUser | undefined> {
    const result = await db
      .select()
      .from(vendorUsers)
      .where(eq(vendorUsers.email, email));
    return result[0];
  }
  
  async createVendorUser(user: InsertVendorUser): Promise<VendorUser> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const result = await db
      .insert(vendorUsers)
      .values({
        ...user,
        password: hashedPassword
      })
      .returning();
    return result[0];
  }
  
  async updateVendorUser(id: number, user: Partial<InsertVendorUser>): Promise<VendorUser> {
    const updateData: any = {
      ...user,
      updatedAt: new Date()
    };
    
    // Hash password if it's being updated
    if (user.password) {
      updateData.password = await bcrypt.hash(user.password, 10);
    }
    
    const result = await db
      .update(vendorUsers)
      .set(updateData)
      .where(eq(vendorUsers.id, id))
      .returning();
    return result[0];
  }
  
  async deleteVendorUser(id: number): Promise<void> {
    await db.delete(vendorUsers).where(eq(vendorUsers.id, id));
  }
  
  async verifyVendorUserPassword(username: string, password: string): Promise<VendorUser | null> {
    const user = await this.getVendorUserByUsername(username);
    
    if (!user || !user.isActive) {
      return null;
    }
    
    // Check if user is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      await this.incrementFailedLoginAttempts(user.id);
      return null;
    }
    
    // Reset failed login attempts on successful login
    await this.resetFailedLoginAttempts(user.id);
    
    return user;
  }
  
  async updateVendorUserLoginInfo(userId: number, ip: string): Promise<void> {
    await db
      .update(vendorUsers)
      .set({
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        updatedAt: new Date()
      })
      .where(eq(vendorUsers.id, userId));
  }
  
  async incrementFailedLoginAttempts(userId: number): Promise<void> {
    const user = await this.getVendorUserById(userId);
    if (!user) return;
    
    const attempts = (user.failedLoginAttempts || 0) + 1;
    
    // Lock user after 5 failed attempts for 30 minutes
    if (attempts >= 5) {
      await this.lockVendorUser(userId, 30);
    } else {
      await db
        .update(vendorUsers)
        .set({
          failedLoginAttempts: attempts,
          updatedAt: new Date()
        })
        .where(eq(vendorUsers.id, userId));
    }
  }
  
  async resetFailedLoginAttempts(userId: number): Promise<void> {
    await db
      .update(vendorUsers)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date()
      })
      .where(eq(vendorUsers.id, userId));
  }
  
  async lockVendorUser(userId: number, durationMinutes: number): Promise<void> {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + durationMinutes);
    
    await db
      .update(vendorUsers)
      .set({
        lockedUntil: lockUntil,
        updatedAt: new Date()
      })
      .where(eq(vendorUsers.id, userId));
  }
  
  // ============================================================================
  // VENDOR PRODUCTS MANAGEMENT
  // ============================================================================
  
  async getVendorShowcaseProducts(vendorId: number): Promise<ShowcaseProduct[]> {
    return await db
      .select()
      .from(showcaseProducts)
      .where(eq(showcaseProducts.vendorId, vendorId))
      .orderBy(desc(showcaseProducts.createdAt));
  }
  
  async getVendorShopProducts(vendorId: number): Promise<ShopProduct[]> {
    return await db
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.vendorId, vendorId))
      .orderBy(desc(shopProducts.createdAt));
  }
  
  async getVendorProductCount(vendorId: number): Promise<number> {
    const showcaseCount = await db
      .select({ count: count() })
      .from(showcaseProducts)
      .where(eq(showcaseProducts.vendorId, vendorId));
    
    const shopCount = await db
      .select({ count: count() })
      .from(shopProducts)
      .where(eq(shopProducts.vendorId, vendorId));
    
    return (showcaseCount[0]?.count || 0) + (shopCount[0]?.count || 0);
  }
  
  async searchVendorProducts(vendorId: number, query: string): Promise<{
    showcaseProducts: ShowcaseProduct[];
    shopProducts: ShopProduct[];
  }> {
    const searchPattern = `%${query}%`;
    
    const showcaseResults = await db
      .select()
      .from(showcaseProducts)
      .where(and(
        eq(showcaseProducts.vendorId, vendorId),
        or(
          like(showcaseProducts.name, searchPattern),
          like(showcaseProducts.sku, searchPattern),
          like(showcaseProducts.barcode, searchPattern)
        )
      ))
      .orderBy(desc(showcaseProducts.createdAt));
    
    const shopResults = await db
      .select()
      .from(shopProducts)
      .where(and(
        eq(shopProducts.vendorId, vendorId),
        or(
          like(shopProducts.name, searchPattern),
          like(shopProducts.sku, searchPattern),
          like(shopProducts.barcode, searchPattern)
        )
      ))
      .orderBy(desc(shopProducts.createdAt));
    
    return {
      showcaseProducts: showcaseResults,
      shopProducts: shopResults
    };
  }
}

export const vendorStorage = new VendorStorage();
