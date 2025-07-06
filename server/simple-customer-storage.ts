import {
  customers,
  customerInquiries,
  inquiryResponses,
  type Customer,
  type InsertCustomer,
  type CustomerInquiry,
  type InsertCustomerInquiry,
  type InquiryResponse,
  type InsertInquiryResponse,
} from "@shared/customer-schema";
import { customerDb } from "./customer-db";
import { eq, desc, and, or, ilike, count, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Simplified interface for dashboard functionality
export interface ISimpleCustomerStorage {
  // Customer authentication and management
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  verifyCustomerPassword(email: string, password: string): Promise<Customer | null>;
  updateCustomerPassword(id: number, newPassword: string): Promise<void>;
  
  // Customer inquiries
  createInquiry(inquiry: InsertCustomerInquiry): Promise<CustomerInquiry>;
  getInquiryById(id: number): Promise<CustomerInquiry | undefined>;
  getInquiriesByCustomer(customerId: number): Promise<CustomerInquiry[]>;
  getAllInquiries(): Promise<CustomerInquiry[]>;
  updateInquiry(id: number, inquiry: Partial<InsertCustomerInquiry>): Promise<CustomerInquiry>;
  updateInquiryStatus(id: number, status: string): Promise<CustomerInquiry>;
  
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
}

export class SimpleCustomerStorage implements ISimpleCustomerStorage {
  // Customer operations
  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const hashedPassword = await bcrypt.hash(customerData.passwordHash, 10);
    const [customer] = await customerDb
      .insert(customers)
      .values({
        ...customerData,
        passwordHash: hashedPassword,
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await customerDb
      .update(customers)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id));
  }

  // Inquiry operations
  async createInquiry(inquiryData: InsertCustomerInquiry): Promise<CustomerInquiry> {
    // Generate a unique inquiry number
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const inquiryNumber = `INQ-${timestamp}-${randomSuffix}`;
    
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

  async updateInquiryStatus(id: number, status: string): Promise<CustomerInquiry> {
    const [inquiry] = await customerDb
      .update(customerInquiries)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(eq(customerInquiries.id, id))
      .returning();
    return inquiry;
  }

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
      .orderBy(desc(inquiryResponses.createdAt));
  }

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
}

export const simpleCustomerStorage = new SimpleCustomerStorage();