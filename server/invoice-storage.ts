import { shopDb } from "./shop-db";
import { invoices, invoiceItems, orders, orderItems, customers, type Invoice, type InvoiceItem, type InsertInvoice, type InsertInvoiceItem } from "@shared/shop-schema";
import { eq, desc, and } from "drizzle-orm";

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
  generateInvoiceFromOrder(orderId: number): Promise<Invoice>;
  requestOfficialInvoice(invoiceId: number): Promise<Invoice>;
  processOfficialInvoice(invoiceId: number, companyInfo: any, taxInfo: any): Promise<Invoice>;
  markInvoiceAsPaid(invoiceId: number, paymentDate?: Date): Promise<Invoice>;
  sendInvoiceEmail(invoiceId: number): Promise<boolean>;

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

  async generateInvoiceFromOrder(orderId: number): Promise<Invoice> {
    // Get order details
    const [order] = await shopDb
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      throw new Error("Order not found");
    }

    // Get order items
    const items = await shopDb
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Create invoice
    const invoiceData: InsertInvoice = {
      invoiceNumber,
      orderId: order.id,
      customerId: order.customerId,
      status: order.paymentStatus === 'paid' ? 'paid' : 'sent',
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      currency: order.currency,
      billingAddress: order.billingAddress,
      notes: order.notes,
      paymentDate: order.paymentStatus === 'paid' ? new Date() : undefined,
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

  async requestOfficialInvoice(invoiceId: number, language: 'ar' | 'en' = 'ar'): Promise<Invoice> {
    return await this.updateInvoice(invoiceId, {
      officialRequestedAt: new Date(),
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
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    // Get count of invoices for this month
    const startOfMonth = new Date(year, today.getMonth(), 1);
    const endOfMonth = new Date(year, today.getMonth() + 1, 0);
    
    const existingInvoices = await shopDb
      .select()
      .from(invoices)
      .where(and(
        eq(invoices.issueDate, startOfMonth),
        eq(invoices.issueDate, endOfMonth)
      ));

    const sequence = existingInvoices.length + 1;
    return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
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