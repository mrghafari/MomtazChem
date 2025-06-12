import {
  customers,
  customerOrders,
  orderItems,
  customerInquiries,
  inquiryResponses,
  quoteRequests,
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
  type QuoteRequest,
  type InsertQuoteRequest,
} from "@shared/customer-schema";
import { customerDb } from "./customer-db";
import { eq, desc, and, or, ilike, count } from "drizzle-orm";
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
  
  // Quote requests
  createQuoteRequest(quote: InsertQuoteRequest): Promise<QuoteRequest>;
  getQuoteRequestById(id: number): Promise<QuoteRequest | undefined>;
  getQuoteRequestsByCustomer(customerId: number): Promise<QuoteRequest[]>;
  getAllQuoteRequests(): Promise<QuoteRequest[]>;
  updateQuoteRequest(id: number, quote: Partial<InsertQuoteRequest>): Promise<QuoteRequest>;
  
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
    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const [order] = await customerDb
      .insert(customerOrders)
      .values({
        ...orderData,
        orderNumber,
      })
      .returning();
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

    const [totalOrdersResult] = await customerDb
      .select({ count: count() })
      .from(customerOrders);

    const [totalInquiriesResult] = await customerDb
      .select({ count: count() })
      .from(customerInquiries);

    const [totalQuoteRequestsResult] = await customerDb
      .select({ count: count() })
      .from(quoteRequests);

    const [pendingOrdersResult] = await customerDb
      .select({ count: count() })
      .from(customerOrders)
      .where(or(
        eq(customerOrders.status, 'pending'),
        eq(customerOrders.status, 'confirmed'),
        eq(customerOrders.status, 'processing')
      ));

    const [openInquiriesResult] = await customerDb
      .select({ count: count() })
      .from(customerInquiries)
      .where(or(
        eq(customerInquiries.status, 'open'),
        eq(customerInquiries.status, 'in_progress')
      ));

    const [pendingQuotesResult] = await customerDb
      .select({ count: count() })
      .from(quoteRequests)
      .where(eq(quoteRequests.status, 'pending'));

    return {
      totalCustomers: totalCustomersResult.count,
      totalOrders: totalOrdersResult.count,
      totalInquiries: totalInquiriesResult.count,
      totalQuoteRequests: totalQuoteRequestsResult.count,
      pendingOrders: pendingOrdersResult.count,
      openInquiries: openInquiriesResult.count,
      pendingQuotes: pendingQuotesResult.count,
    };
  }
}

export const customerStorage = new CustomerStorage();