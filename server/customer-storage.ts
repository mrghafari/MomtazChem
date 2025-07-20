import {
  customers,
  customerOrders,
  orderItems,
  customerInquiries,
  inquiryResponses,
  type Customer,
  type InsertCustomer,
  type CustomerOrder,
  type InsertCustomerOrder,
  type OrderItem,
  type InsertOrderItem,
  type CustomerInquiry,
  type InsertCustomerInquiry,
  type InquiryResponse,
  type InsertInquiryResponse,
  emailTemplates,
  type EmailTemplate,
  type InsertEmailTemplate,
} from "@shared/customer-schema";
import { customerDb } from "./customer-db";
import { eq, desc, and, or, ilike, count, sql, sum } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface ICustomerStorage {
  // Customer authentication and management
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  verifyCustomerPassword(email: string, password: string): Promise<Customer | null>;
  updateCustomerPassword(id: number, newPassword: string): Promise<void>;
  
  // Customer orders
  createOrder(order: InsertCustomerOrder): Promise<CustomerOrder>;
  getOrderById(id: number): Promise<CustomerOrder | undefined>;
  getOrdersByCustomer(customerId: number): Promise<CustomerOrder[]>;
  updateOrder(id: number, order: Partial<InsertCustomerOrder>): Promise<CustomerOrder>;
  getAllOrders(): Promise<CustomerOrder[]>;
  
  // Order items
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  updateOrderItem(id: number, item: Partial<InsertOrderItem>): Promise<OrderItem>;
  deleteOrderItem(id: number): Promise<void>;
  
  // Customer inquiries
  createInquiry(inquiry: InsertCustomerInquiry): Promise<CustomerInquiry>;
  getInquiryById(id: number): Promise<CustomerInquiry | undefined>;
  getInquiriesByCustomer(customerId: number): Promise<CustomerInquiry[]>;
  getAllInquiries(): Promise<CustomerInquiry[]>;
  updateInquiry(id: number, inquiry: Partial<InsertCustomerInquiry>): Promise<CustomerInquiry>;
  
  // Inquiry responses
  createInquiryResponse(response: InsertInquiryResponse): Promise<InquiryResponse>;
  getInquiryResponses(inquiryId: number): Promise<InquiryResponse[]>;
  

  
  // Analytics and stats
  getCustomerStats(): Promise<{
    totalCustomers: number;
    totalOrders: number;
    totalInquiries: number;
    totalQuoteRequests: number;
    pendingOrders: number;
    openInquiries: number;
    pendingQuotes: number;
  }>;

  // Email template management
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplateById(id: number): Promise<EmailTemplate | undefined>;
  getEmailTemplatesByCategory(category: string): Promise<EmailTemplate[]>;
  getDefaultTemplateForCategory(category: string, language?: string): Promise<EmailTemplate | undefined>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(id: number): Promise<void>;
  setDefaultTemplate(id: number, category: string): Promise<void>;
  incrementTemplateUsage(id: number): Promise<void>;
}

export class CustomerStorage implements ICustomerStorage {
  // Customer authentication and management
  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    // Hash password before storing
    const passwordHash = await bcrypt.hash(customerData.passwordHash, 12);
    
    const [customer] = await customerDb
      .insert(customers)
      .values({
        ...customerData,
        passwordHash,
      })
      .returning();
    return customer;
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [customer] = await customerDb
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await customerDb
      .select()
      .from(customers)
      .where(eq(customers.email, email));
    return customer;
  }

  async updateCustomer(id: number, customerUpdate: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await customerDb
      .update(customers)
      .set({
        ...customerUpdate,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async verifyCustomerPassword(email: string, password: string): Promise<Customer | null> {
    const customer = await this.getCustomerByEmail(email);
    if (!customer) return null;

    const isValidPassword = await bcrypt.compare(password, customer.passwordHash);
    return isValidPassword ? customer : null;
  }

  async updateCustomerPassword(id: number, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await customerDb
      .update(customers)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(customers.id, id));
  }

  // Customer orders
  async createOrder(orderData: InsertCustomerOrder): Promise<CustomerOrder> {
    // Generate unique order number using MOM format
    const { generateOrderNumber } = await import('./order-number-generator');
    const orderNumber = await generateOrderNumber();
    
    console.log('🔢 [CUSTOMER-STORAGE] Generated MOM order number:', orderNumber);
    
    const [order] = await customerDb
      .insert(customerOrders)
      .values({
        ...orderData,
        orderNumber,
      })
      .returning();
    
    // Update customer metrics after creating order
    if (order.customerId) {
      await this.updateCustomerMetricsAfterOrder(order.customerId);
    }
    
    return order;
  }

  async getOrderById(id: number): Promise<CustomerOrder | undefined> {
    const [order] = await customerDb
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.id, id));
    return order;
  }

  async getOrdersByCustomer(customerId: number): Promise<CustomerOrder[]> {
    return await customerDb
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.customerId, customerId))
      .orderBy(desc(customerOrders.createdAt));
  }

  async updateOrder(id: number, orderUpdate: Partial<InsertCustomerOrder>): Promise<CustomerOrder> {
    const [order] = await customerDb
      .update(customerOrders)
      .set({
        ...orderUpdate,
        updatedAt: new Date(),
      })
      .where(eq(customerOrders.id, id))
      .returning();
    return order;
  }

  async getAllOrders(): Promise<CustomerOrder[]> {
    return await customerDb
      .select()
      .from(customerOrders)
      .orderBy(desc(customerOrders.createdAt));
  }

  // Helper method to update customer metrics after order creation
  private async updateCustomerMetricsAfterOrder(customerId: number): Promise<void> {
    try {
      // Calculate metrics from orders
      const result = await customerDb
        .select({
          totalOrders: count(customerOrders.id),
          totalSpent: sum(customerOrders.totalAmount),
          lastOrderDate: sql<Date>`MAX(${customerOrders.createdAt})`,
        })
        .from(customerOrders)
        .where(eq(customerOrders.customerId, customerId));

      if (result.length > 0) {
        const metrics = result[0];
        
        // Update customer record with actual database column names
        await customerDb
          .update(customers)
          .set({
            totalOrders: metrics.totalOrders || 0,
            totalSpent: metrics.totalSpent?.toString() || "0",
            lastOrderDate: metrics.lastOrderDate,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, customerId));
      }
    } catch (error) {
      console.error("Error updating customer metrics after order:", error);
    }
  }

  // Order items
  async createOrderItem(itemData: InsertOrderItem): Promise<OrderItem> {
    const [item] = await customerDb
      .insert(orderItems)
      .values(itemData)
      .returning();
    return item;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await customerDb
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async updateOrderItem(id: number, itemUpdate: Partial<InsertOrderItem>): Promise<OrderItem> {
    const [item] = await customerDb
      .update(orderItems)
      .set(itemUpdate)
      .where(eq(orderItems.id, id))
      .returning();
    return item;
  }

  async deleteOrderItem(id: number): Promise<void> {
    await customerDb
      .delete(orderItems)
      .where(eq(orderItems.id, id));
  }

  // Customer inquiries
  async createInquiry(inquiryData: InsertCustomerInquiry): Promise<CustomerInquiry> {
    // Generate unique inquiry number
    const inquiryNumber = `INQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const [inquiry] = await customerDb
      .insert(customerInquiries)
      .values({
        ...inquiryData,
        inquiryNumber,
      })
      .returning();
    return inquiry;
  }

  async getInquiryById(id: number): Promise<CustomerInquiry | undefined> {
    const [inquiry] = await customerDb
      .select()
      .from(customerInquiries)
      .where(eq(customerInquiries.id, id));
    return inquiry;
  }

  async getInquiriesByCustomer(customerId: number): Promise<CustomerInquiry[]> {
    return await customerDb
      .select()
      .from(customerInquiries)
      .where(eq(customerInquiries.customerId, customerId))
      .orderBy(desc(customerInquiries.createdAt));
  }

  async getAllInquiries(): Promise<CustomerInquiry[]> {
    return await customerDb
      .select()
      .from(customerInquiries)
      .orderBy(desc(customerInquiries.createdAt));
  }

  async updateInquiry(id: number, inquiryUpdate: Partial<InsertCustomerInquiry>): Promise<CustomerInquiry> {
    const [inquiry] = await customerDb
      .update(customerInquiries)
      .set({
        ...inquiryUpdate,
        updatedAt: new Date(),
      })
      .where(eq(customerInquiries.id, id))
      .returning();
    return inquiry;
  }

  // Inquiry responses
  async createInquiryResponse(responseData: InsertInquiryResponse): Promise<InquiryResponse> {
    const [response] = await customerDb
      .insert(inquiryResponses)
      .values(responseData)
      .returning();
    return response;
  }

  async getInquiryResponses(inquiryId: number): Promise<InquiryResponse[]> {
    return await customerDb
      .select()
      .from(inquiryResponses)
      .where(eq(inquiryResponses.inquiryId, inquiryId))
      .orderBy(inquiryResponses.createdAt);
  }

  // Quote requests
  async createQuoteRequest(quoteData: InsertQuoteRequest): Promise<QuoteRequest> {
    // Generate unique quote number
    const quoteNumber = `QUO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const [quote] = await customerDb
      .insert(quoteRequests)
      .values({
        ...quoteData,
        quoteNumber,
      })
      .returning();
    return quote;
  }

  async getQuoteRequestById(id: number): Promise<QuoteRequest | undefined> {
    const [quote] = await customerDb
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.id, id));
    return quote;
  }

  async getQuoteRequestsByCustomer(customerId: number): Promise<QuoteRequest[]> {
    return await customerDb
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.customerId, customerId))
      .orderBy(desc(quoteRequests.createdAt));
  }

  async getAllQuoteRequests(): Promise<QuoteRequest[]> {
    return await customerDb
      .select()
      .from(quoteRequests)
      .orderBy(desc(quoteRequests.createdAt));
  }

  async updateQuoteRequest(id: number, quoteUpdate: Partial<InsertQuoteRequest>): Promise<QuoteRequest> {
    const [quote] = await customerDb
      .update(quoteRequests)
      .set({
        ...quoteUpdate,
        updatedAt: new Date(),
      })
      .where(eq(quoteRequests.id, id))
      .returning();
    return quote;
  }

  // Analytics and stats
  async getCustomerStats(): Promise<{
    totalCustomers: number;
    totalOrders: number;
    totalInquiries: number;
    totalQuoteRequests: number;
    pendingOrders: number;
    openInquiries: number;
    pendingQuotes: number;
  }> {
    const [totalCustomersResult] = await customerDb
      .select({ count: count() })
      .from(customers);

    const [totalInquiriesResult] = await customerDb
      .select({ count: count() })
      .from(customerInquiries);

    const [openInquiriesResult] = await customerDb
      .select({ count: count() })
      .from(customerInquiries)
      .where(or(
        eq(customerInquiries.status, 'open'),
        eq(customerInquiries.status, 'in_progress')
      ));

    return {
      totalCustomers: totalCustomersResult.count,
      totalOrders: 0, // Orders table not implemented yet
      totalInquiries: totalInquiriesResult.count,
      totalQuoteRequests: 0, // Quote requests table not implemented yet
      pendingOrders: 0, // Orders table not implemented yet
      openInquiries: openInquiriesResult.count,
      pendingQuotes: 0, // Quote requests table not implemented yet
    };
  }

  // Email template management
  async createEmailTemplate(templateData: InsertEmailTemplate): Promise<EmailTemplate> {
    const [template] = await customerDb
      .insert(emailTemplates)
      .values({
        ...templateData,
        usageCount: 0,
      })
      .returning();
    return template;
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await customerDb
      .select()
      .from(emailTemplates)
      .orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplateById(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await customerDb
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return template;
  }

  async getEmailTemplatesByCategory(category: string): Promise<EmailTemplate[]> {
    return await customerDb
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.category, category),
        eq(emailTemplates.isActive, true)
      ))
      .orderBy(desc(emailTemplates.isDefault), desc(emailTemplates.usageCount));
  }

  async getDefaultTemplateForCategory(category: string, language: string = 'en'): Promise<EmailTemplate | undefined> {
    const [template] = await customerDb
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.category, category),
        eq(emailTemplates.language, language),
        eq(emailTemplates.isDefault, true),
        eq(emailTemplates.isActive, true)
      ));
    return template;
  }

  async updateEmailTemplate(id: number, templateUpdate: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const [template] = await customerDb
      .update(emailTemplates)
      .set({
        ...templateUpdate,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, id))
      .returning();
    return template;
  }

  async deleteEmailTemplate(id: number): Promise<void> {
    await customerDb
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, id));
  }

  async setDefaultTemplate(id: number, category: string): Promise<void> {
    // First remove default status from all templates in this category
    await customerDb
      .update(emailTemplates)
      .set({ isDefault: false })
      .where(eq(emailTemplates.category, category));

    // Then set the specified template as default
    await customerDb
      .update(emailTemplates)
      .set({ isDefault: true })
      .where(eq(emailTemplates.id, id));
  }

  async incrementTemplateUsage(id: number): Promise<void> {
    await customerDb
      .update(emailTemplates)
      .set({ 
        lastUsed: new Date() 
      })
      .where(eq(emailTemplates.id, id));
    
    // Increment usage count separately
    await customerDb
      .execute(sql`UPDATE email_templates SET usage_count = usage_count + 1 WHERE id = ${id}`);
  }
}

export const customerStorage = new CustomerStorage();