import {
  customers,
  customerOrders,
  orderItems,
  customerInquiries,
  inquiryResponses,
  customerVerificationCodes,
  customerEmailVerificationCodes,
  customerVerificationSettings,
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
  type CustomerVerificationCode,
  type InsertCustomerVerificationCode,
  type CustomerEmailVerificationCode,
  type InsertCustomerEmailVerificationCode,
  type CustomerVerificationSettings,
  type InsertCustomerVerificationSettings,
  emailTemplates,
  type EmailTemplate,
  type InsertEmailTemplate,
} from "@shared/customer-schema";
import { customerDb } from "./customer-db";
import { eq, desc, and, or, ilike, count, sql, sum, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { CartStorage } from "./cart-storage";

export interface ICustomerStorage {
  // Customer authentication and management
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  verifyCustomerPassword(email: string, password: string): Promise<Customer | null>;
  updateCustomerPassword(id: number, newPassword: string): Promise<void>;
  
  // Dual verification system (SMS + Email)
  createSmsVerificationCode(customerId: number | null, phone: string, code: string): Promise<CustomerVerificationCode>;
  createEmailVerificationCode(customerId: number | null, email: string, code: string): Promise<CustomerEmailVerificationCode>;
  verifySmsCode(phone: string, code: string): Promise<CustomerVerificationCode | null>;
  verifyEmailCode(email: string, code: string): Promise<CustomerEmailVerificationCode | null>;
  getVerificationSettings(): Promise<CustomerVerificationSettings | null>;
  updateVerificationSettings(settings: Partial<InsertCustomerVerificationSettings>): Promise<CustomerVerificationSettings>;
  
  // Customer orders
  createOrder(order: InsertCustomerOrder): Promise<CustomerOrder>;
  getOrderById(id: number): Promise<CustomerOrder | undefined>;
  getOrdersByCustomer(customerId: number): Promise<CustomerOrder[]>;
  updateOrder(id: number, order: Partial<InsertCustomerOrder>): Promise<CustomerOrder>;
  getAllOrders(): Promise<CustomerOrder[]>;
  deleteTemporaryOrder(id: number): Promise<{ success: boolean; releasedProducts: any[] }>;
  
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
  private cartStorage = new CartStorage();
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
    try {
      const [customer] = await customerDb
        .select()
        .from(customers)
        .where(eq(customers.id, id));
      return customer;
    } catch (error) {
      console.error("Error fetching customer:", error);
      return undefined;
    }
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
    // Import order management storage to use new numbering system
    const { OrderManagementStorage } = await import('./order-management-storage');
    const orderManagementStorage = new OrderManagementStorage();
    
    // Generate M[YY][NNNNN] order number (e.g., M2511111, M2511112)
    const orderNumber = await orderManagementStorage.generateOrderNumber();
    
    const [order] = await customerDb
      .insert(customerOrders)
      .values({
        ...orderData,
        orderNumber,
      })
      .returning();
    
    // Add customer order to order management system for financial processing
    try {
      await orderManagementStorage.addCustomerOrderToManagement(order.id);
      console.log(`✅ [ORDER CREATION] Customer order ${order.orderNumber} added to management system`);
    } catch (error) {
      console.error(`❌ [ORDER CREATION] Failed to add order ${order.orderNumber} to management system:`, error);
    }
    
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
      .where(and(
        eq(customerOrders.customerId, customerId),
        ne(customerOrders.status, 'deleted') // فیلتر کردن سفارشات حذف شده
      ))
      .orderBy(desc(customerOrders.createdAt));
  }

  // Get orders for customer profile display with priority for temporary orders and abandoned cart tracking
  async getOrdersForProfile(customerId: number): Promise<{ 
    displayOrders: CustomerOrder[], 
    totalOrders: number, 
    hiddenOrders: number,
    abandonedOrders: CustomerOrder[],
    hasAbandonedOrders: boolean,
    abandonedCarts: any[],
    hasAbandonedCarts: boolean
  }> {
    // Get all orders for the customer (excluding deleted orders)
    const allOrders = await customerDb
      .select()
      .from(customerOrders)
      .where(and(
        eq(customerOrders.customerId, customerId),
        ne(customerOrders.status, 'deleted') // فیلتر کردن سفارشات حذف شده از نمایش پروفایل
      ))
      .orderBy(desc(customerOrders.createdAt));

    const totalOrders = allOrders.length;

    // Identify abandoned orders (grace period expired without payment)
    const now = new Date();
    const abandonedOrders = allOrders.filter(order => {
      // Check if this is a grace period order that has expired
      if (order.paymentMethod === 'bank_transfer_grace' && order.status === 'payment_grace_period') {
        // Calculate if grace period has expired (3 days)
        const orderDate = new Date(order.createdAt);
        const gracePeriodEnd = new Date(orderDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
        return now > gracePeriodEnd;
      }
      return false;
    });

    // Separate temporary and regular orders (excluding abandoned ones)
    const activeOrders = allOrders.filter(order => 
      !abandonedOrders.find(abandoned => abandoned.id === order.id)
    );

    const temporaryOrders = activeOrders.filter(order => 
      (order.paymentMethod === 'bank_transfer_grace' && order.status === 'payment_grace_period')
    );
    
    const regularOrders = activeOrders.filter(order => 
      order.paymentMethod !== 'bank_transfer_grace'
    );

    let displayOrders: CustomerOrder[] = [];

    if (totalOrders <= 2) {
      return {
        displayOrders: activeOrders,
        totalOrders,
        hiddenOrders: 0,
        abandonedOrders,
        hasAbandonedOrders: abandonedOrders.length > 0,
        abandonedCarts: [],
        hasAbandonedCarts: false
      };
    }

    if (temporaryOrders.length > 0) {
      // If there are temporary orders, show 1 temporary + 1 regular
      displayOrders.push(temporaryOrders[0]); // Most recent temporary order
      
      if (regularOrders.length > 0) {
        displayOrders.push(regularOrders[0]); // Most recent regular order
      } else if (temporaryOrders.length > 1) {
        displayOrders.push(temporaryOrders[1]); // Second temporary order if no regular orders
      }
    } else {
      // If no temporary orders, show 2 most recent regular orders
      displayOrders = regularOrders.slice(0, 2);
    }

    const hiddenOrders = activeOrders.length - displayOrders.length;

    // Get abandoned carts (سبد خرید رها شده)
    const abandonedCarts = await this.cartStorage.getAbandonedCartsByCustomer(customerId);

    return {
      displayOrders,
      totalOrders: activeOrders.length,
      hiddenOrders,
      abandonedOrders,
      hasAbandonedOrders: abandonedOrders.length > 0,
      abandonedCarts,
      hasAbandonedCarts: abandonedCarts.length > 0
    };
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

  async getCompleteOrderHistory(customerId: number): Promise<any[]> {
    try {
      console.log(`🔍 [COMPLETE HISTORY] Loading complete order history for customer ${customerId}`);
      
      // Get all orders for this customer (including deleted ones)
      const orders = await customerDb.select()
        .from(customerOrders)
        .where(eq(customerOrders.customerId, customerId))
        .orderBy(desc(customerOrders.createdAt));

      console.log(`📊 [COMPLETE HISTORY] Found ${orders.length} total orders (including deleted)`);

      // Get order items for all orders
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await customerDb.select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));

          return {
            ...order,
            items: items || []
          };
        })
      );

      console.log(`✅ [COMPLETE HISTORY] Loaded complete history with ${ordersWithItems.length} orders`);
      return ordersWithItems;

    } catch (error) {
      console.error('❌ [COMPLETE HISTORY] Error loading complete order history:', error);
      return [];
    }
  }

  async deleteTemporaryOrder(id: number): Promise<{ success: boolean; releasedProducts: any[] }> {
    try {
      // First check if this is a temporary order
      const order = await this.getOrderById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      // Check if order is temporary (pending status or grace period)
      if (order.status !== 'pending' && order.status !== 'payment_grace_period') {
        throw new Error('فقط سفارشات موقت قابل حذف هستند');
      }

      // CRITICAL: Never allow deletion if payment has been made or receipt uploaded
      if (order.paymentStatus === 'paid' || order.paymentStatus === 'processing' || order.paymentStatus === 'confirmed') {
        throw new Error('سفارشات پرداخت شده قابل حذف نیستند');
      }

      if (order.receiptPath) {
        throw new Error('سفارشاتی که رسید آپلود شده قابل حذف نیستند');
      }

      // Get order items to release reservations
      const items = await this.getOrderItems(id);
      const releasedProducts: any[] = [];

      // Release product reservations by adding quantities back to inventory
      if (items.length > 0) {
        const { db } = await import('./db');
        const { shopProducts } = await import('@shared/shop-schema');
        
        for (const item of items) {
          if (item.productId && item.quantity) {
            // Add quantity back to shop product inventory
            await db
              .update(shopProducts)
              .set({
                stockQuantity: sql`stock_quantity + ${parseFloat(item.quantity)}`,
                updatedAt: new Date()
              })
              .where(eq(shopProducts.id, item.productId));

            releasedProducts.push({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              released: true
            });
          }
        }
      }

      // Delete order items first (foreign key constraint)
      await customerDb
        .delete(orderItems)
        .where(eq(orderItems.orderId, id));

      // Update order status to 'deleted' instead of hard deletion to preserve numbering
      await customerDb
        .update(customerOrders)
        .set({
          status: 'deleted',
          updatedAt: new Date()
        })
        .where(eq(customerOrders.id, id));

      console.log(`✅ [DELETE TEMPORARY] Order ${order.orderNumber} marked as deleted with ${releasedProducts.length} products released`);
      
      return {
        success: true,
        releasedProducts
      };

    } catch (error) {
      console.error('❌ [DELETE TEMPORARY] Error deleting temporary order:', error);
      return {
        success: false,
        releasedProducts: []
      };
    }
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

  // Quote requests - temporarily disabled due to missing schema
  // Will re-enable when quote_requests table and types are properly defined

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

  // =============================================================================
  // DUAL VERIFICATION SYSTEM (SMS + EMAIL)
  // =============================================================================

  // Create SMS verification code
  async createSmsVerificationCode(customerId: number | null, phone: string, code: string): Promise<CustomerVerificationCode> {
    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const [verificationCode] = await customerDb
      .insert(customerVerificationCodes)
      .values({
        customerId,
        phoneNumber: phone,
        verificationCode: code,
        expiresAt,
      })
      .returning();
    
    console.log(`📱 SMS verification code created for phone: ${phone}`);
    return verificationCode;
  }

  // Create email verification code
  async createEmailVerificationCode(customerId: number | null, email: string, code: string): Promise<CustomerEmailVerificationCode> {
    // Set expiration to 30 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    const [verificationCode] = await customerDb
      .insert(customerEmailVerificationCodes)
      .values({
        customerId,
        email,
        verificationCode: code,
        expiresAt,
      })
      .returning();
    
    console.log(`📧 Email verification code created for email: ${email}`);
    return verificationCode;
  }

  // Verify SMS code
  async verifySmsCode(phone: string, code: string): Promise<CustomerVerificationCode | null> {
    const [verificationCode] = await customerDb
      .select()
      .from(customerVerificationCodes)
      .where(
        and(
          eq(customerVerificationCodes.phoneNumber, phone),
          eq(customerVerificationCodes.verificationCode, code),
          eq(customerVerificationCodes.isUsed, false),
          sql`expires_at > NOW()`
        )
      )
      .limit(1);

    if (verificationCode) {
      // Mark as used
      await customerDb
        .update(customerVerificationCodes)
        .set({ isUsed: true })
        .where(eq(customerVerificationCodes.id, verificationCode.id));

      console.log(`✅ SMS verification successful for phone: ${phone}`);
      return verificationCode;
    }

    console.log(`❌ SMS verification failed for phone: ${phone}`);
    return null;
  }

  // Verify email code
  async verifyEmailCode(email: string, code: string): Promise<CustomerEmailVerificationCode | null> {
    const [verificationCode] = await customerDb
      .select()
      .from(customerEmailVerificationCodes)
      .where(
        and(
          eq(customerEmailVerificationCodes.email, email),
          eq(customerEmailVerificationCodes.verificationCode, code),
          eq(customerEmailVerificationCodes.isUsed, false),
          sql`expires_at > NOW()`
        )
      )
      .limit(1);

    if (verificationCode) {
      // Mark as used
      await customerDb
        .update(customerEmailVerificationCodes)
        .set({ isUsed: true })
        .where(eq(customerEmailVerificationCodes.id, verificationCode.id));

      console.log(`✅ Email verification successful for email: ${email}`);
      return verificationCode;
    }

    console.log(`❌ Email verification failed for email: ${email}`);
    return null;
  }

  // Get current verification settings
  async getVerificationSettings(): Promise<CustomerVerificationSettings | null> {
    const [settings] = await customerDb
      .select()
      .from(customerVerificationSettings)
      .limit(1);
    
    return settings || null;
  }

  // Update verification settings
  async updateVerificationSettings(settingsUpdate: Partial<InsertCustomerVerificationSettings>): Promise<CustomerVerificationSettings> {
    // Check if settings exist
    const existingSettings = await this.getVerificationSettings();
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await customerDb
        .update(customerVerificationSettings)
        .set({
          ...settingsUpdate,
          updatedAt: new Date(),
        })
        .where(eq(customerVerificationSettings.id, existingSettings.id))
        .returning();
      
      return updatedSettings;
    } else {
      // Create new settings with defaults
      const [newSettings] = await customerDb
        .insert(customerVerificationSettings)
        .values({
          smsVerificationEnabled: true,
          emailVerificationEnabled: true,
          requireBothVerifications: true,
          allowSkipVerification: false,
          ...settingsUpdate,
        })
        .returning();
      
      return newSettings;
    }
  }
}

export const customerStorage = new CustomerStorage();