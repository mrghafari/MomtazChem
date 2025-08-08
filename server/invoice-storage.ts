import { shopDb } from "./shop-db";
import { db } from "./db";
import { invoices, invoiceItems, orders, orderItems, customers, type Invoice, type InvoiceItem, type InsertInvoice, type InsertInvoiceItem } from "@shared/shop-schema";
import { orderManagement } from "@shared/order-management-schema";
import { customerOrders } from "@shared/customer-schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";

export interface IInvoiceStorage {
  // Invoice management
  createInvoice(invoiceData: InsertInvoice): Promise<Invoice>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  getInvoicesByCustomer(customerId: number): Promise<Invoice[]>;
  getInvoicesByOrder(orderId: number): Promise<Invoice[]>;
  getAllInvoices(): Promise<Invoice[]>;
  updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: number): Promise<void>;

  // Invoice items
  createInvoiceItem(itemData: InsertInvoiceItem): Promise<InvoiceItem>;
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  updateInvoiceItem(id: number, itemData: Partial<InsertInvoiceItem>): Promise<InvoiceItem>;
  deleteInvoiceItem(id: number): Promise<void>;

  // Invoice operations
  generateInvoiceFromOrder(orderId: number, language?: string): Promise<Invoice>;
  requestOfficialInvoice(invoiceId: number, language?: string): Promise<Invoice>;
  processOfficialInvoice(invoiceId: number, companyInfo: any, taxInfo: any): Promise<Invoice>;
  markInvoiceAsPaid(invoiceId: number, paymentDate?: Date): Promise<Invoice>;
  sendInvoiceEmail(invoiceId: number): Promise<boolean>;
  updateInvoiceLanguage(invoiceId: number, language: string): Promise<Invoice>;

  // Invoice statistics
  getInvoiceStats(): Promise<{
    totalInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
    officialInvoices: number;
    totalAmount: number;
    paidAmount: number;
  }>;
}

export class InvoiceStorage implements IInvoiceStorage {
  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const [invoice] = await shopDb
      .insert(invoices)
      .values(invoiceData)
      .returning();
    return invoice;
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    const [invoice] = await shopDb
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await shopDb
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber));
    return invoice;
  }

  async getInvoicesByCustomer(customerId: number): Promise<Invoice[]> {
    return await shopDb
      .select()
      .from(invoices)
      .where(eq(invoices.customerId, customerId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByOrder(orderId: number): Promise<Invoice[]> {
    return await shopDb
      .select()
      .from(invoices)
      .where(eq(invoices.orderId, orderId))
      .orderBy(desc(invoices.createdAt));
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return await shopDb
      .select()
      .from(invoices)
      .orderBy(desc(invoices.createdAt));
  }

  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice> {
    const [invoice] = await shopDb
      .update(invoices)
      .set({ ...invoiceData, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async deleteInvoice(id: number): Promise<void> {
    await shopDb.delete(invoices).where(eq(invoices.id, id));
  }

  async createInvoiceItem(itemData: InsertInvoiceItem): Promise<InvoiceItem> {
    const [item] = await shopDb
      .insert(invoiceItems)
      .values(itemData)
      .returning();
    return item;
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await shopDb
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async updateInvoiceItem(id: number, itemData: Partial<InsertInvoiceItem>): Promise<InvoiceItem> {
    const [item] = await shopDb
      .update(invoiceItems)
      .set(itemData)
      .where(eq(invoiceItems.id, id))
      .returning();
    return item;
  }

  async deleteInvoiceItem(id: number): Promise<void> {
    await shopDb.delete(invoiceItems).where(eq(invoiceItems.id, id));
  }

  async generateInvoiceFromOrder(orderId: number, language: string = 'ar'): Promise<Invoice> {
    // First, check if orderId refers to customer_orders or shop orders
    // Try customer_orders first
    const [customerOrder] = await db
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.id, orderId));

    if (customerOrder) {
      // Check financial approval and payment status for customer order
      const [orderMgmt] = await db
        .select()
        .from(orderManagement)
        .where(eq(orderManagement.customerOrderId, orderId));

      if (!orderMgmt) {
        throw new Error("سفارش در سیستم مدیریت سفارشات یافت نشد");
      }

      // Check financial approval
      if (!orderMgmt.financialReviewedAt) {
        throw new Error("این سفارش هنوز تایید مالی نگرفته است. فاکتور فقط برای سفارشات تایید شده مالی صادر می‌شود.");
      }

      // BUSINESS RULE CHANGE: No longer require payment completion for invoice generation
      // Invoices can be generated when orders leave warehouse, regardless of payment status
      // This supports orders with grace periods and other business scenarios
      console.log(`📄 [INVOICE GEN] Generating invoice for order ${customerOrder.orderNumber} with payment status: ${customerOrder.paymentStatus}`);

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Create invoice for customer order
      const invoiceData: InsertInvoice = {
        invoiceNumber,
        orderId: customerOrder.id,
        customerId: customerOrder.customerId,
        status: 'paid',
        subtotal: customerOrder.totalAmount,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: customerOrder.totalAmount,
        currency: customerOrder.currency || 'IQD',
        billingAddress: customerOrder.billingAddress,
        notes: customerOrder.notes,
        language: language,
        paymentDate: new Date(),
      };

      const invoice = await this.createInvoice(invoiceData);
      return invoice;
    }

    // If not found in customer_orders, try shop orders (legacy)
    const [order] = await shopDb
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      throw new Error("سفارش یافت نشد");
    }

    // BUSINESS RULE CHANGE: No longer require payment completion for shop orders either
    // This maintains consistency across all order types
    console.log(`📄 [INVOICE GEN] Generating invoice for shop order ${order.id} with payment status: ${order.paymentStatus}`);

    // Get order items
    const items = await shopDb
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Create invoice with language support
    const invoiceData: InsertInvoice = {
      invoiceNumber,
      orderId: order.id,
      customerId: order.customerId,
      status: 'paid',
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      currency: order.currency,
      billingAddress: order.billingAddress,
      notes: order.notes,
      language: language,
      paymentDate: new Date(),
    };

    const invoice = await this.createInvoice(invoiceData);

    // Create invoice items
    for (const item of items) {
      await this.createInvoiceItem({
        invoiceId: invoice.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      });
    }

    return invoice;
  }

  async requestOfficialInvoice(invoiceId: number, language: string = 'ar'): Promise<Invoice> {
    return await this.updateInvoice(invoiceId, {
      officialRequestedAt: new Date(),
      language: language,
    });
  }

  async updateInvoiceLanguage(invoiceId: number, language: string): Promise<Invoice> {
    return await this.updateInvoice(invoiceId, {
      language: language,
    });
  }

  async processOfficialInvoice(invoiceId: number, companyInfo: any, taxInfo: any): Promise<Invoice> {
    return await this.updateInvoice(invoiceId, {
      isOfficial: true,
      type: 'official',
      companyInfo,
      taxInfo,
      officialProcessedAt: new Date(),
    });
  }

  async markInvoiceAsPaid(invoiceId: number, paymentDate?: Date): Promise<Invoice> {
    return await this.updateInvoice(invoiceId, {
      status: 'paid',
      paymentDate: paymentDate || new Date(),
    });
  }

  async sendInvoiceEmail(invoiceId: number): Promise<boolean> {
    // This will be implemented with the email system
    await this.updateInvoice(invoiceId, {
      emailSent: true,
      emailSentAt: new Date(),
    });
    return true;
  }

  private async generateInvoiceNumber(): Promise<string> {
    let attempt = 0;
    const maxAttempts = 100;
    
    while (attempt < maxAttempts) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      
      // Get all invoices for this month to calculate sequence
      const monthPrefix = `INV-${year}${month}-`;
      
      const existingInvoices = await shopDb
        .select({ invoiceNumber: invoices.invoiceNumber })
        .from(invoices);

      // Filter invoices for this month and find the highest sequence
      let maxSequence = 0;
      for (const invoice of existingInvoices) {
        if (invoice.invoiceNumber.startsWith(monthPrefix)) {
          const parts = invoice.invoiceNumber.split('-');
          if (parts.length >= 3) {
            const sequenceNum = parseInt(parts[2]) || 0;
            if (sequenceNum > maxSequence) {
              maxSequence = sequenceNum;
            }
          }
        }
      }

      const nextSequence = maxSequence + 1;
      const proposedNumber = `INV-${year}${month}-${String(nextSequence).padStart(4, '0')}`;
      
      // Check if this number already exists
      const existingInvoice = await this.getInvoiceByNumber(proposedNumber);
      if (!existingInvoice) {
        return proposedNumber;
      }
      
      attempt++;
    }
    
    // Fallback with timestamp if all attempts fail
    const timestamp = Date.now();
    return `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${timestamp}`;
  }

  async getInvoiceStats(): Promise<{
    totalInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
    officialInvoices: number;
    totalAmount: number;
    paidAmount: number;
  }> {
    const allInvoices = await this.getAllInvoices();
    
    const stats = {
      totalInvoices: allInvoices.length,
      paidInvoices: allInvoices.filter(inv => inv.status === 'paid').length,
      overdueInvoices: allInvoices.filter(inv => 
        inv.status !== 'paid' && inv.dueDate && new Date(inv.dueDate) < new Date()
      ).length,
      officialInvoices: allInvoices.filter(inv => inv.isOfficial).length,
      totalAmount: allInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0),
      paidAmount: allInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0),
    };

    return stats;
  }
}

export const invoiceStorage = new InvoiceStorage();