import { eq, desc, and, or, sql, count, sum, avg } from "drizzle-orm";
import { customerDb } from "./customer-db";
import { crmDb } from "./crm-db";
import { 
  customers, 
  customerOrders,
  customerActivities, 
  customerSegments,
  type InsertCustomer, 
  type Customer,
  type InsertCustomerActivity,
  type CustomerActivity,
  type InsertCustomerSegment,
  type CustomerSegment
} from "../shared/customer-schema";
import {
  crmCustomers,
  type CrmCustomer,
  type InsertCrmCustomer,
  type UpsertCrmCustomer
} from "../shared/schema";
import { 
  crmCustomers,
  type InsertCrmCustomer, 
  type CrmCustomer
} from "../shared/schema";

export interface ICrmStorage {
  // CRM Customer Management (using proper CRM table)
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
    phone: string;
    country: string;
    city: string;
    address: string;
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
    const [customer] = await customerDb
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
    console.log("CrmStorage updateCrmCustomer called:", { id, customerUpdate });
    
    try {
      // Handle date fields properly - convert strings to Date objects if needed
      const processedUpdate = { ...customerUpdate };
      
      // Handle updatedAt - always set to current date
      processedUpdate.updatedAt = new Date();
      
      // Handle other date fields if they exist in the update
      if (processedUpdate.createdAt && typeof processedUpdate.createdAt === 'string') {
        processedUpdate.createdAt = new Date(processedUpdate.createdAt);
      }
      if (processedUpdate.lastOrderDate && typeof processedUpdate.lastOrderDate === 'string') {
        processedUpdate.lastOrderDate = new Date(processedUpdate.lastOrderDate);
      }
      if (processedUpdate.firstOrderDate && typeof processedUpdate.firstOrderDate === 'string') {
        processedUpdate.firstOrderDate = new Date(processedUpdate.firstOrderDate);
      }
      if (processedUpdate.lastContactDate && typeof processedUpdate.lastContactDate === 'string') {
        processedUpdate.lastContactDate = new Date(processedUpdate.lastContactDate);
      }
      
      console.log("Processed update data:", processedUpdate);
      
      const [customer] = await crmDb
        .update(crmCustomers)
        .set(processedUpdate)
        .where(eq(crmCustomers.id, id))
        .returning();
      
      console.log("CrmStorage updateCrmCustomer result:", customer);
      
      if (!customer) {
        throw new Error("Customer not found");
      }
      
      // Log update activity
      await this.logCustomerActivity({
        customerId: id,
        activityType: "customer_updated",
        description: `Customer information was updated`,
        performedBy: "admin",
        activityData: { updatedFields: Object.keys(customerUpdate) }
      });
      
      return customer;
    } catch (error) {
      console.error("CrmStorage updateCrmCustomer error:", error);
      throw error;
    }
  }

  async deleteCrmCustomer(id: number): Promise<void> {
    await customerDb
      .update(customers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(customers.id, id));
  }

  async searchCrmCustomers(query: string): Promise<Customer[]> {
    const searchTerm = `%${query}%`;
    const customerData = await customerDb
      .select({
        id: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        company: customers.company,
        phone: customers.phone,
        country: customers.country,
        city: customers.city,
        customerType: customers.customerType,
        customerStatus: customers.customerStatus,
        customerSource: customers.customerSource,
        lastOrderDate: customers.lastOrderDate,
        createdAt: customers.createdAt,
        isActive: customers.isActive,
        totalOrdersCount: sql<number>`COUNT(${customerOrders.id})`,
        totalSpent: sql<string>`COALESCE(SUM(${customerOrders.totalAmount}), 0)`,
        averageOrderValue: sql<string>`CASE 
          WHEN COUNT(${customerOrders.id}) > 0 THEN COALESCE(SUM(${customerOrders.totalAmount}), 0) / COUNT(${customerOrders.id})
          ELSE 0 
        END`,
      })
      .from(customers)
      .leftJoin(customerOrders, eq(customers.id, customerOrders.customerId))
      .where(
        and(
          eq(customers.isActive, true),
          or(
            sql`${customers.firstName} ILIKE ${searchTerm}`,
            sql`${customers.lastName} ILIKE ${searchTerm}`,
            sql`${customers.email} ILIKE ${searchTerm}`,
            sql`${customers.company} ILIKE ${searchTerm}`,
            sql`${customers.phone} ILIKE ${searchTerm}`
          )
        )
      )
      .groupBy(
        customers.id,
        customers.email,
        customers.firstName,
        customers.lastName,
        customers.company,
        customers.phone,
        customers.country,
        customers.city,
        customers.customerType,
        customers.customerStatus,
        customers.customerSource,
        customers.lastOrderDate,
        customers.createdAt,
        customers.isActive
      )
      .orderBy(sql`COALESCE(SUM(${customerOrders.totalAmount}), 0) DESC`)
      .limit(50);

    return customerData;
  }

  async getCrmCustomers(limit: number = 50, offset: number = 0): Promise<CrmCustomer[]> {
    const customerData = await crmDb
      .select()
      .from(crmCustomers)
      .where(eq(crmCustomers.isActive, true))
      .orderBy(desc(crmCustomers.updatedAt))
      .limit(limit)
      .offset(offset);

    return customerData;
  }

  async createOrUpdateCustomerFromOrder(orderData: {
    email: string;
    firstName: string;
    lastName: string;
    company?: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    postalCode?: string;
    orderValue: number;
  }): Promise<Customer> {
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
      const newCustomerData: InsertCustomer = {
        email: orderData.email,
        passwordHash: '', // Will be set when customer creates account
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
        isActive: true,
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
    try {
      // Calculate real metrics from customer orders
      const result = await customerDb
        .select({
          totalOrders: count(customerOrders.id),
          totalSpent: sum(customerOrders.totalAmount),
          averageOrderValue: avg(customerOrders.totalAmount),
          lastOrderDate: sql<Date>`MAX(${customerOrders.createdAt})`,
          firstOrderDate: sql<Date>`MIN(${customerOrders.createdAt})`,
        })
        .from(customerOrders)
        .where(eq(customerOrders.customerId, customerId));

      if (result.length > 0) {
        const metrics = result[0];
        
        // Update customer with calculated metrics using actual database column names
        await customerDb
          .update(customers)
          .set({
            totalOrders: metrics.totalOrders || 0,
            totalSpent: metrics.totalSpent?.toString() || "0",
            lastOrderDate: metrics.lastOrderDate ? new Date(metrics.lastOrderDate) : null,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, customerId));
      }
    } catch (error) {
      console.error("Error updating customer metrics:", error);
    }
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
    const [activity] = await customerDb
      .insert(customerActivities)
      .values(activityData)
      .returning();
    return activity;
  }

  async getCustomerActivities(customerId: number, limit: number = 20): Promise<CustomerActivity[]> {
    return await customerDb
      .select()
      .from(customerActivities)
      .where(eq(customerActivities.customerId, customerId))
      .orderBy(desc(customerActivities.createdAt))
      .limit(limit);
  }

  async createCustomerSegment(segmentData: InsertCustomerSegment): Promise<CustomerSegment> {
    const [segment] = await customerDb
      .insert(customerSegments)
      .values(segmentData)
      .returning();
    return segment;
  }

  async getCustomerSegments(): Promise<CustomerSegment[]> {
    return await customerDb
      .select()
      .from(customerSegments)
      .where(eq(customerSegments.isActive, true))
      .orderBy(desc(customerSegments.createdAt));
  }

  async getCustomersInSegment(segmentId: number): Promise<Customer[]> {
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
    const [totalCustomersResult] = await customerDb
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.isActive, true));
    
    // Get active customers (ordered in last 90 days)
    const [activeCustomersResult] = await customerDb
      .select({ count: count() })
      .from(customers)
      .where(
        and(
          eq(customers.isActive, true),
          sql`${customers.lastOrderDate} > NOW() - INTERVAL '90 days'`
        )
      );
    
    // Get new customers this month
    const [newCustomersResult] = await customerDb
      .select({ count: count() })
      .from(customers)
      .where(
        and(
          eq(customers.isActive, true),
          sql`${customers.createdAt} > DATE_TRUNC('month', NOW())`
        )
      );
    
    // Get total revenue from actual orders
    const [totalRevenueResult] = await customerDb
      .select({ 
        totalRevenue: sum(customerOrders.totalAmount),
        avgOrderValue: avg(customerOrders.totalAmount)
      })
      .from(customerOrders);
    
    // Get top customers based on actual order data
    const topCustomers = await customerDb
      .select({
        id: customers.id,
        name: sql<string>`${customers.firstName} || ' ' || ${customers.lastName}`,
        email: customers.email,
        totalSpent: sql<string>`COALESCE(SUM(${customerOrders.totalAmount}), 0)`,
        totalOrders: sql<number>`COUNT(${customerOrders.id})`,
      })
      .from(customers)
      .leftJoin(customerOrders, eq(customers.id, customerOrders.customerId))
      .where(eq(customers.isActive, true))
      .groupBy(customers.id, customers.firstName, customers.lastName, customers.email)
      .orderBy(sql`SUM(${customerOrders.totalAmount}) DESC NULLS LAST`)
      .limit(10);
    
    // Get customers by type (using available customer_type if exists, otherwise default categorization)
    const customersByType = await customerDb
      .select({
        type: sql<string>`CASE 
          WHEN ${customers.company} IS NOT NULL AND ${customers.company} != '' THEN 'business'
          ELSE 'individual'
        END`,
        count: count()
      })
      .from(customers)
      .where(eq(customers.isActive, true))
      .groupBy(sql`CASE 
        WHEN ${customers.company} IS NOT NULL AND ${customers.company} != '' THEN 'business'
        ELSE 'individual'
      END`);
    
    // Get recent activities
    const recentActivities = await customerDb
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