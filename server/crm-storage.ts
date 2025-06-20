import { eq, desc, and, or, sql, count, sum, avg } from "drizzle-orm";
import { crmDb } from "./crm-db";
import { 
  crmCustomers, 
  customerActivities, 
  customerSegments,
  type InsertCrmCustomer, 
  type CrmCustomer,
  type InsertCustomerActivity,
  type CustomerActivity,
  type InsertCustomerSegment,
  type CustomerSegment
} from "../shared/customer-schema";

export interface ICrmStorage {
  // CRM Customer Management
  createCrmCustomer(customer: InsertCrmCustomer): Promise<CrmCustomer>;
  getCrmCustomerById(id: number): Promise<CrmCustomer | undefined>;
  getCrmCustomerByEmail(email: string): Promise<CrmCustomer | undefined>;
  updateCrmCustomer(id: number, customer: Partial<InsertCrmCustomer>): Promise<CrmCustomer>;
  deleteCrmCustomer(id: number): Promise<void>;
  searchCrmCustomers(query: string): Promise<CrmCustomer[]>;
  getCrmCustomers(limit?: number, offset?: number): Promise<CrmCustomer[]>;
  
  // Auto-capture from shop purchases
  createOrUpdateCustomerFromOrder(orderData: {
    email: string;
    firstName: string;
    lastName: string;
    company?: string;
    phone?: string;
    country?: string;
    city?: string;
    address?: string;
    postalCode?: string;
    orderValue: number;
  }): Promise<CrmCustomer>;
  
  // Customer Analytics
  updateCustomerMetrics(customerId: number): Promise<void>;
  getCustomerAnalytics(customerId: number): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: Date;
    firstOrderDate?: Date;
    daysSinceLastOrder?: number;
  }>;
  
  // Customer Activities
  logCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity>;
  getCustomerActivities(customerId: number, limit?: number): Promise<CustomerActivity[]>;
  
  // Customer Segmentation
  createCustomerSegment(segment: InsertCustomerSegment): Promise<CustomerSegment>;
  getCustomerSegments(): Promise<CustomerSegment[]>;
  getCustomersInSegment(segmentId: number): Promise<CrmCustomer[]>;
  
  // CRM Dashboard Stats
  getCrmDashboardStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    totalRevenue: number;
    averageOrderValue: number;
    topCustomers: Array<{
      id: number;
      name: string;
      email: string;
      totalSpent: number;
      totalOrders: number;
    }>;
    customersByType: Array<{
      type: string;
      count: number;
    }>;
    recentActivities: CustomerActivity[];
  }>;
}

export class CrmStorage implements ICrmStorage {
  
  async createCrmCustomer(customerData: InsertCrmCustomer): Promise<CrmCustomer> {
    const [customer] = await crmDb
      .insert(crmCustomers)
      .values(customerData)
      .returning();
    
    // Log creation activity
    await this.logCustomerActivity({
      customerId: customer.id,
      activityType: "customer_created",
      description: `Customer ${customer.firstName} ${customer.lastName} was created`,
      performedBy: customerData.createdBy || "system",
      activityData: { source: customerData.customerSource }
    });
    
    return customer;
  }

  async getCrmCustomerById(id: number): Promise<CrmCustomer | undefined> {
    const [customer] = await crmDb
      .select()
      .from(crmCustomers)
      .where(eq(crmCustomers.id, id))
      .limit(1);
    return customer;
  }

  async getCrmCustomerByEmail(email: string): Promise<CrmCustomer | undefined> {
    const [customer] = await crmDb
      .select()
      .from(crmCustomers)
      .where(eq(crmCustomers.email, email))
      .limit(1);
    return customer;
  }

  async updateCrmCustomer(id: number, customerUpdate: Partial<InsertCrmCustomer>): Promise<CrmCustomer> {
    const [customer] = await crmDb
      .update(crmCustomers)
      .set({ ...customerUpdate, updatedAt: new Date() })
      .where(eq(crmCustomers.id, id))
      .returning();
    
    // Log update activity
    await this.logCustomerActivity({
      customerId: id,
      activityType: "customer_updated",
      description: `Customer information was updated`,
      performedBy: "admin",
      activityData: { updatedFields: Object.keys(customerUpdate) }
    });
    
    return customer;
  }

  async deleteCrmCustomer(id: number): Promise<void> {
    await crmDb
      .update(crmCustomers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(crmCustomers.id, id));
  }

  async searchCrmCustomers(query: string): Promise<CrmCustomer[]> {
    const searchTerm = `%${query}%`;
    return await crmDb
      .select()
      .from(crmCustomers)
      .where(
        and(
          eq(crmCustomers.isActive, true),
          or(
            sql`${crmCustomers.firstName} ILIKE ${searchTerm}`,
            sql`${crmCustomers.lastName} ILIKE ${searchTerm}`,
            sql`${crmCustomers.email} ILIKE ${searchTerm}`,
            sql`${crmCustomers.company} ILIKE ${searchTerm}`,
            sql`${crmCustomers.phone} ILIKE ${searchTerm}`
          )
        )
      )
      .orderBy(desc(crmCustomers.lastOrderDate))
      .limit(50);
  }

  async getCrmCustomers(limit: number = 50, offset: number = 0): Promise<CrmCustomer[]> {
    return await crmDb
      .select()
      .from(crmCustomers)
      .where(eq(crmCustomers.isActive, true))
      .orderBy(desc(crmCustomers.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createOrUpdateCustomerFromOrder(orderData: {
    email: string;
    firstName: string;
    lastName: string;
    company?: string;
    phone?: string;
    country?: string;
    city?: string;
    address?: string;
    postalCode?: string;
    orderValue: number;
  }): Promise<CrmCustomer> {
    // Check if customer already exists
    let customer = await this.getCrmCustomerByEmail(orderData.email);
    
    if (customer) {
      // Update existing customer
      const currentOrders = customer.totalOrdersCount || 0;
      const currentSpent = parseFloat(customer.totalSpent || "0");
      const newTotalOrders = currentOrders + 1;
      const newTotalSpent = currentSpent + orderData.orderValue;
      const newAverageOrderValue = newTotalSpent / newTotalOrders;
      
      const updateData = {
        // Update contact info if not present
        firstName: customer.firstName || orderData.firstName,
        lastName: customer.lastName || orderData.lastName,
        company: customer.company || orderData.company,
        phone: customer.phone || orderData.phone,
        country: customer.country || orderData.country,
        city: customer.city || orderData.city,
        address: customer.address || orderData.address,
        postalCode: customer.postalCode || orderData.postalCode,
        lastOrderDate: new Date(),
        firstOrderDate: customer.firstOrderDate || new Date(),
        lastContactDate: new Date(),
      };
      
      customer = await this.updateCrmCustomer(customer.id, updateData);
      
      // Log order activity
      await this.logCustomerActivity({
        customerId: customer.id,
        activityType: "order_placed",
        description: `Order placed for $${orderData.orderValue.toFixed(2)}`,
        performedBy: "system",
        activityData: { orderValue: orderData.orderValue, orderCount: newTotalOrders }
      });
      
    } else {
      // Create new customer
      const newCustomerData: InsertCrmCustomer = {
        email: orderData.email,
        firstName: orderData.firstName,
        lastName: orderData.lastName,
        company: orderData.company,
        phone: orderData.phone,
        country: orderData.country,
        city: orderData.city,
        address: orderData.address,
        postalCode: orderData.postalCode,
        
        customerSource: "website",
        customerType: "retail",
        firstOrderDate: new Date(),
        lastOrderDate: new Date(),
        lastContactDate: new Date(),
        createdBy: "auto_order",
      };
      
      customer = await this.createCrmCustomer(newCustomerData);
      
      // Log first order activity
      await this.logCustomerActivity({
        customerId: customer.id,
        activityType: "first_order",
        description: `First order placed for $${orderData.orderValue.toFixed(2)}`,
        performedBy: "system",
        activityData: { orderValue: orderData.orderValue, isFirstOrder: true }
      });
    }
    
    return customer;
  }

  async updateCustomerMetrics(customerId: number): Promise<void> {
    // This would calculate metrics from actual order data
    // For now, we'll implement a placeholder that can be enhanced later
    const customer = await this.getCrmCustomerById(customerId);
    if (!customer) return;
    
    // Update last contact date
    await crmDb
      .update(crmCustomers)
      .set({ 
        lastContactDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(crmCustomers.id, customerId));
  }

  async getCustomerAnalytics(customerId: number): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: Date;
    firstOrderDate?: Date;
    daysSinceLastOrder?: number;
  }> {
    const customer = await this.getCrmCustomerById(customerId);
    if (!customer) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0
      };
    }
    
    const daysSinceLastOrder = customer.lastOrderDate 
      ? Math.floor((new Date().getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;
    
    return {
      totalOrders: customer.totalOrdersCount || 0,
      totalSpent: parseFloat(customer.totalSpent || "0"),
      averageOrderValue: parseFloat(customer.averageOrderValue || "0"),
      lastOrderDate: customer.lastOrderDate || undefined,
      firstOrderDate: customer.firstOrderDate || undefined,
      daysSinceLastOrder
    };
  }

  async logCustomerActivity(activityData: InsertCustomerActivity): Promise<CustomerActivity> {
    const [activity] = await crmDb
      .insert(customerActivities)
      .values(activityData)
      .returning();
    return activity;
  }

  async getCustomerActivities(customerId: number, limit: number = 20): Promise<CustomerActivity[]> {
    return await crmDb
      .select()
      .from(customerActivities)
      .where(eq(customerActivities.customerId, customerId))
      .orderBy(desc(customerActivities.createdAt))
      .limit(limit);
  }

  async createCustomerSegment(segmentData: InsertCustomerSegment): Promise<CustomerSegment> {
    const [segment] = await crmDb
      .insert(customerSegments)
      .values(segmentData)
      .returning();
    return segment;
  }

  async getCustomerSegments(): Promise<CustomerSegment[]> {
    return await crmDb
      .select()
      .from(customerSegments)
      .where(eq(customerSegments.isActive, true))
      .orderBy(desc(customerSegments.createdAt));
  }

  async getCustomersInSegment(segmentId: number): Promise<CrmCustomer[]> {
    // This would implement segment criteria matching
    // For now, return empty array as placeholder
    return [];
  }

  async getCrmDashboardStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    totalRevenue: number;
    averageOrderValue: number;
    topCustomers: Array<{
      id: number;
      name: string;
      email: string;
      totalSpent: number;
      totalOrders: number;
    }>;
    customersByType: Array<{
      type: string;
      count: number;
    }>;
    recentActivities: CustomerActivity[];
  }> {
    // Get total customers
    const [totalCustomersResult] = await crmDb
      .select({ count: count() })
      .from(crmCustomers)
      .where(eq(crmCustomers.isActive, true));
    
    // Get active customers (ordered in last 90 days)
    const [activeCustomersResult] = await crmDb
      .select({ count: count() })
      .from(crmCustomers)
      .where(
        and(
          eq(crmCustomers.isActive, true),
          sql`${crmCustomers.lastOrderDate} > NOW() - INTERVAL '90 days'`
        )
      );
    
    // Get new customers this month
    const [newCustomersResult] = await crmDb
      .select({ count: count() })
      .from(crmCustomers)
      .where(
        and(
          eq(crmCustomers.isActive, true),
          sql`${crmCustomers.createdAt} > DATE_TRUNC('month', NOW())`
        )
      );
    
    // Get total revenue
    const [totalRevenueResult] = await crmDb
      .select({ 
        totalRevenue: sum(crmCustomers.totalSpent),
        avgOrderValue: avg(crmCustomers.averageOrderValue)
      })
      .from(crmCustomers)
      .where(eq(crmCustomers.isActive, true));
    
    // Get top customers
    const topCustomers = await crmDb
      .select({
        id: crmCustomers.id,
        name: sql<string>`${crmCustomers.firstName} || ' ' || ${crmCustomers.lastName}`,
        email: crmCustomers.email,
        totalSpent: crmCustomers.totalSpent,
        totalOrders: crmCustomers.totalOrdersCount,
      })
      .from(crmCustomers)
      .where(eq(crmCustomers.isActive, true))
      .orderBy(desc(crmCustomers.totalSpent))
      .limit(10);
    
    // Get customers by type
    const customersByType = await crmDb
      .select({
        type: crmCustomers.customerType,
        count: count()
      })
      .from(crmCustomers)
      .where(eq(crmCustomers.isActive, true))
      .groupBy(crmCustomers.customerType);
    
    // Get recent activities
    const recentActivities = await crmDb
      .select()
      .from(customerActivities)
      .orderBy(desc(customerActivities.createdAt))
      .limit(10);
    
    return {
      totalCustomers: totalCustomersResult.count || 0,
      activeCustomers: activeCustomersResult.count || 0,
      newCustomersThisMonth: newCustomersResult.count || 0,
      totalRevenue: parseFloat(totalRevenueResult.totalRevenue || "0"),
      averageOrderValue: parseFloat(totalRevenueResult.avgOrderValue || "0"),
      topCustomers: topCustomers.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalSpent: parseFloat(customer.totalSpent || "0"),
        totalOrders: customer.totalOrders || 0,
      })),
      customersByType: customersByType.map(item => ({
        type: item.type || "unknown",
        count: item.count || 0,
      })),
      recentActivities
    };
  }
}

export const crmStorage = new CrmStorage();