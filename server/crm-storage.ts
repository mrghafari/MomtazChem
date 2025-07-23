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
  type InsertCrmCustomer
} from "../shared/schema";

export interface ICrmStorage {
  // CRM Customer Management (using proper CRM table)
  createCrmCustomer(customer: InsertCrmCustomer): Promise<CrmCustomer>;
  getCrmCustomerById(id: number): Promise<CrmCustomer | undefined>;
  getCrmCustomerByEmail(email: string): Promise<CrmCustomer | undefined>;
  getCrmCustomerByPhone(phone: string): Promise<CrmCustomer | undefined>;
  updateCrmCustomer(id: number, customer: Partial<InsertCrmCustomer>): Promise<CrmCustomer>;
  deleteCrmCustomer(id: number): Promise<void>;
  searchCrmCustomers(query: string): Promise<CrmCustomer[]>;
  getCrmCustomers(limit?: number, offset?: number): Promise<CrmCustomer[]>;
  
  // Duplicate prevention
  checkEmailExists(email: string, excludeId?: number): Promise<boolean>;
  checkPhoneExists(phone: string, excludeId?: number): Promise<boolean>;
  
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
  getRecentCustomerActivities(limit?: number): Promise<CustomerActivity[]>;
  
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
    // Check for duplicate email
    if (customerData.email && await this.checkEmailExists(customerData.email)) {
      throw new Error("ایمیل تکراری است. این ایمیل قبلاً در سیستم ثبت شده است.");
    }
    
    // Check for duplicate phone
    if (customerData.phone && await this.checkPhoneExists(customerData.phone)) {
      throw new Error("شماره تلفن تکراری است. این شماره قبلاً در سیستم ثبت شده است.");
    }
    
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
      // Check for duplicate email (excluding current customer)
      if (customerUpdate.email && await this.checkEmailExists(customerUpdate.email, id)) {
        throw new Error("ایمیل تکراری است. این ایمیل قبلاً در سیستم ثبت شده است.");
      }
      
      // Check for duplicate phone (excluding current customer)
      if (customerUpdate.phone && await this.checkPhoneExists(customerUpdate.phone, id)) {
        throw new Error("شماره تلفن تکراری است. این شماره قبلاً در سیستم ثبت شده است.");
      }
      
      // Handle date fields properly - convert strings to Date objects if needed
      const processedUpdate = { ...customerUpdate };
      
      console.log("[CRM UPDATE] Original update data:", customerUpdate);
      console.log("[CRM UPDATE] resetPasswordExpires type:", typeof customerUpdate.resetPasswordExpires, customerUpdate.resetPasswordExpires);
      
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
      if (processedUpdate.resetPasswordExpires && typeof processedUpdate.resetPasswordExpires === 'string') {
        processedUpdate.resetPasswordExpires = new Date(processedUpdate.resetPasswordExpires);
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
    try {
      // Log deletion activity before removing customer
      await this.logCustomerActivity({
        customerId: id,
        activityType: "customer_deleted",
        description: `Customer was permanently deleted from CRM`,
        performedBy: "admin",
        activityData: { deletionTime: new Date().toISOString() }
      });
      
      // Actually delete the customer from the CRM database
      await crmDb
        .delete(crmCustomers)
        .where(eq(crmCustomers.id, id));
        
      console.log(`CRM Customer ${id} deleted successfully`);
    } catch (error) {
      console.error("Error deleting CRM customer:", error);
      throw error;
    }
  }

  async searchCrmCustomers(query: string): Promise<CrmCustomer[]> {
    const searchTerm = `%${query}%`;
    const customerData = await crmDb
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
      .orderBy(desc(crmCustomers.updatedAt))
      .limit(50);

    return customerData;
  }

  async getCrmCustomers(limit: number = 50, offset: number = 0): Promise<CrmCustomer[]> {
    const customerData = await crmDb
      .select()
      .from(crmCustomers)
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
    // Get customer name if customerId is provided but customerName is not
    if (activityData.customerId && !activityData.customerName) {
      try {
        const customer = await this.getCrmCustomerById(activityData.customerId);
        if (customer) {
          activityData.customerName = `${customer.firstName} ${customer.lastName}`;
        }
      } catch (error) {
        console.log('Could not find customer for activity logging:', error);
      }
    }
    
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
    // Get total customers from CRM database
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
    
    // Get total revenue from actual orders
    const [totalRevenueResult] = await customerDb
      .select({ 
        totalRevenue: sum(customerOrders.totalAmount),
        avgOrderValue: avg(customerOrders.totalAmount)
      })
      .from(customerOrders);
    
    // Get top customers based on live calculation from orders
    const topCustomers = await crmDb
      .select({
        id: crmCustomers.id,
        name: sql<string>`${crmCustomers.firstName} || ' ' || ${crmCustomers.lastName}`,
        email: crmCustomers.email,
        totalSpent: sql<string>`COALESCE(SUM(${customerOrders.totalAmount}), 0)`,
        totalOrders: sql<number>`COUNT(${customerOrders.id})`,
      })
      .from(crmCustomers)
      .leftJoin(customerOrders, eq(crmCustomers.id, customerOrders.customerId))
      .where(eq(crmCustomers.isActive, true))
      .groupBy(crmCustomers.id, crmCustomers.firstName, crmCustomers.lastName, crmCustomers.email)
      .orderBy(sql`SUM(${customerOrders.totalAmount}) DESC NULLS LAST`)
      .limit(10);
    
    // Get customers by type using CRM customer_type field
    const customersByType = await crmDb
      .select({
        type: crmCustomers.customerType,
        count: count()
      })
      .from(crmCustomers)
      .where(eq(crmCustomers.isActive, true))
      .groupBy(crmCustomers.customerType);
    
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

  async getCrmCustomerByPhone(phone: string): Promise<CrmCustomer | undefined> {
    // Support partial phone number matching for auto-complete
    const [customer] = await crmDb
      .select()
      .from(crmCustomers)
      .where(sql`${crmCustomers.phone} LIKE ${`%${phone}%`}`)
      .limit(1);
    return customer;
  }

  async searchCrmCustomersByPhone(phone: string): Promise<CrmCustomer[]> {
    // Return multiple customers matching phone for dropdown selection
    const customers = await crmDb
      .select()
      .from(crmCustomers)
      .where(sql`${crmCustomers.phone} LIKE ${`%${phone}%`}`)
      .limit(5); // Limit to 5 suggestions
    return customers;
  }

  async checkEmailExists(email: string, excludeId?: number): Promise<boolean> {
    let whereClause = eq(crmCustomers.email, email);
    
    if (excludeId) {
      whereClause = and(eq(crmCustomers.email, email), sql`${crmCustomers.id} != ${excludeId}`);
    }
    
    const [customer] = await crmDb
      .select({ id: crmCustomers.id })
      .from(crmCustomers)
      .where(whereClause)
      .limit(1);
    
    return !!customer;
  }

  async checkPhoneExists(phone: string, excludeId?: number): Promise<boolean> {
    let whereClause = eq(crmCustomers.phone, phone);
    
    if (excludeId) {
      whereClause = and(eq(crmCustomers.phone, phone), sql`${crmCustomers.id} != ${excludeId}`);
    }
    
    const [customer] = await crmDb
      .select({ id: crmCustomers.id })
      .from(crmCustomers)
      .where(whereClause)
      .limit(1);
    
    return !!customer;
  }

  async getCrmCustomerByResetToken(token: string): Promise<CrmCustomer | null> {
    const [customer] = await crmDb
      .select()
      .from(crmCustomers)
      .where(eq(crmCustomers.resetPasswordToken, token))
      .limit(1);
    
    return customer || null;
  }



  async logCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity> {
    const [insertedActivity] = await customerDb
      .insert(customerActivities)
      .values(activity)
      .returning();
    return insertedActivity;
  }

  async getCustomerActivities(customerId: number, limit = 50): Promise<CustomerActivity[]> {
    return await customerDb
      .select()
      .from(customerActivities)
      .where(eq(customerActivities.customerId, customerId))
      .orderBy(desc(customerActivities.createdAt))
      .limit(limit);
  }

  async getRecentCustomerActivities(limit = 20): Promise<CustomerActivity[]> {
    return await customerDb
      .select()
      .from(customerActivities)
      .orderBy(desc(customerActivities.createdAt))
      .limit(limit);
  }

  async logActivity(customerId: number, activityType: string, description: string, metadata?: any): Promise<void> {
    try {
      // Implementation for logging customer activities
      // This would normally insert into a customer_activities table
      console.log(`[CRM ACTIVITY] Customer ${customerId}: ${activityType} - ${description}`);
      
      // For now, we'll just log it since we don't have a customer_activities table in the CRM schema
      // In a full implementation, this would be:
      // await crmDb.insert(customerActivities).values({
      //   customerId,
      //   activityType,
      //   description,
      //   metadata: metadata ? JSON.stringify(metadata) : null,
      //   createdAt: new Date()
      // });
    } catch (error) {
      console.error(`[CRM ACTIVITY] Error logging activity for customer ${customerId}:`, error);
    }
  }
}

export const crmStorage = new CrmStorage();