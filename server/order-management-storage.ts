import { 
  orderManagement, 
  orderStatusHistory, 
  departmentAssignments,
  paymentReceipts,
  deliveryCodes,
  type OrderManagement,
  type InsertOrderManagement,
  type OrderStatusHistory,
  type InsertOrderStatusHistory,
  type DepartmentAssignment,
  type InsertDepartmentAssignment,
  type PaymentReceipt,
  type InsertPaymentReceipt,
  type DeliveryCode,
  type InsertDeliveryCode,
  type OrderStatus,
  type Department,
  orderStatuses
} from "@shared/order-management-schema";
import { customerOrders, customers } from "@shared/customer-schema";
import { db } from "./db";
import { eq, and, desc, asc, inArray } from "drizzle-orm";

export interface IOrderManagementStorage {
  // Order Management
  createOrderManagement(orderData: InsertOrderManagement): Promise<OrderManagement>;
  getOrderManagementById(id: number): Promise<OrderManagement | undefined>;
  getOrderManagementByCustomerOrderId(customerOrderId: number): Promise<OrderManagement | undefined>;
  updateOrderManagement(id: number, updateData: Partial<InsertOrderManagement>): Promise<OrderManagement>;
  updateOrderStatus(id: number, newStatus: OrderStatus, changedBy: number, department: Department, notes?: string): Promise<OrderManagement>;
  
  // Workflow sequence validation
  canDepartmentViewOrder(orderId: number, department: Department): Promise<boolean>;
  getNextValidStatuses(currentStatus: OrderStatus, department: Department): OrderStatus[];
  
  // Department filtering (respects sequence)
  getOrdersByDepartment(department: Department, status?: OrderStatus[]): Promise<OrderManagement[]>;
  getFinancialPendingOrders(): Promise<OrderManagement[]>;
  getWarehousePendingOrders(): Promise<OrderManagement[]>;
  getLogisticsPendingOrders(): Promise<OrderManagement[]>;
  
  // Delivery information
  updateDeliveryInfo(orderId: number, deliveryData: {
    trackingNumber?: string;
    estimatedDeliveryDate?: Date;
    deliveryPersonName?: string;
    deliveryPersonPhone?: string;
    deliveryMethod?: string;
    transportationType?: string;
    postalServiceName?: string;
    postalTrackingCode?: string;
    postalWeight?: string;
    postalPrice?: string;
    postalInsurance?: boolean;
    vehicleType?: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    vehicleColor?: string;
    driverName?: string;
    driverPhone?: string;
    driverLicense?: string;
    deliveryCompanyName?: string;
    deliveryCompanyPhone?: string;
    deliveryCompanyAddress?: string;
  }): Promise<void>;
  
  // Payment receipts
  uploadPaymentReceipt(receiptData: InsertPaymentReceipt): Promise<PaymentReceipt>;
  getPaymentReceiptsByOrder(customerOrderId: number): Promise<PaymentReceipt[]>;
  
  // Department assignments
  assignUserToDepartment(assignmentData: InsertDepartmentAssignment): Promise<DepartmentAssignment>;
  getUserDepartments(adminUserId: number): Promise<DepartmentAssignment[]>;
  getDepartmentUsers(department: Department): Promise<DepartmentAssignment[]>;
  
  // Delivery codes
  generateDeliveryCode(orderManagementId: number): Promise<DeliveryCode>;
  verifyDeliveryCode(code: string, verifiedBy: string): Promise<boolean>;
  getDeliveryCodeByOrder(orderManagementId: number): Promise<DeliveryCode | undefined>;
  
  // Status history
  getOrderStatusHistory(orderManagementId: number): Promise<OrderStatusHistory[]>;
  
  // Dashboard stats
  getDepartmentStats(department: Department): Promise<{
    pendingCount: number;
    processedToday: number;
    averageProcessingTime: number;
  }>;
  
  // Admin overview
  getOrdersOverview(): Promise<{
    totalOrders: number;
    pendingFinancial: number;
    pendingWarehouse: number;
    pendingLogistics: number;
    completedToday: number;
    cancelledToday: number;
  }>;
}

export class OrderManagementStorage implements IOrderManagementStorage {
  
  async createOrderManagement(orderData: InsertOrderManagement): Promise<OrderManagement> {
    const [order] = await db
      .insert(orderManagement)
      .values(orderData)
      .returning();
    
    // Log initial status
    await this.logStatusChange(order.id, null, order.currentStatus as OrderStatus, null, null);
    
    return order;
  }
  
  async getOrderManagementById(id: number): Promise<OrderManagement | undefined> {
    const [order] = await db
      .select()
      .from(orderManagement)
      .where(eq(orderManagement.id, id));
    return order;
  }
  
  async getOrderManagementByCustomerOrderId(customerOrderId: number): Promise<OrderManagement | undefined> {
    const [order] = await db
      .select()
      .from(orderManagement)
      .where(eq(orderManagement.customerOrderId, customerOrderId));
    return order;
  }
  
  async updateOrderManagement(id: number, updateData: Partial<InsertOrderManagement>): Promise<OrderManagement> {
    const dataWithTimestamp = {
      ...updateData,
      updatedAt: new Date()
    };
    
    const [updatedOrder] = await db
      .update(orderManagement)
      .set(dataWithTimestamp)
      .where(eq(orderManagement.id, id))
      .returning();
    
    return updatedOrder;
  }
  
  async updateOrderStatus(
    id: number, 
    newStatus: OrderStatus, 
    changedBy: number, 
    department: Department, 
    notes?: string
  ): Promise<OrderManagement> {
    // Get current order
    const currentOrder = await this.getOrderManagementById(id);
    if (!currentOrder) {
      throw new Error('Order not found');
    }
    
    // Update order status and department-specific fields
    const updateData: Partial<OrderManagement> = {
      currentStatus: newStatus,
      updatedAt: new Date(),
    };
    
    // Update department-specific fields
    if (department === 'financial') {
      updateData.financialReviewerId = changedBy;
      updateData.financialReviewedAt = new Date();
      if (notes) updateData.financialNotes = notes;
    } else if (department === 'warehouse') {
      updateData.warehouseAssigneeId = changedBy;
      updateData.warehouseProcessedAt = new Date();
      if (notes) updateData.warehouseNotes = notes;
    } else if (department === 'logistics') {
      updateData.logisticsAssigneeId = changedBy;
      updateData.logisticsProcessedAt = new Date();
      if (notes) updateData.logisticsNotes = notes;
      
      // Generate delivery code when order is dispatched and send SMS
      if (newStatus === orderStatuses.LOGISTICS_DISPATCHED) {
        const deliveryCode = await this.generateDeliveryCode(id);
        // TODO: Send SMS to customer with delivery code
        console.log(`SMS delivery code ${deliveryCode.code} should be sent for order ${id}`);
      }
    }
    
    const [updatedOrder] = await db
      .update(orderManagement)
      .set(updateData)
      .where(eq(orderManagement.id, id))
      .returning();
    
    // Log status change
    await this.logStatusChange(id, currentOrder.currentStatus as OrderStatus, newStatus, changedBy, department, notes);
    
    return updatedOrder;
  }
  
  // کنترل اینکه آیا بخش مشخص می‌تواند سفارش را ببیند یا نه
  async canDepartmentViewOrder(orderId: number, department: Department): Promise<boolean> {
    const order = await this.getOrderManagementById(orderId);
    if (!order) return false;
    
    const currentStatus = order.currentStatus;
    
    switch (department) {
      case 'financial':
        // بخش مالی فقط سفارشات با رسید پرداخت را می‌بیند
        return [
          orderStatuses.PAYMENT_UPLOADED,
          orderStatuses.FINANCIAL_REVIEWING,
          orderStatuses.FINANCIAL_APPROVED,
          orderStatuses.FINANCIAL_REJECTED
        ].includes(currentStatus as any);
        
      case 'warehouse':
        // انبار فقط سفارشات تایید شده مالی را می‌بیند
        return [
          orderStatuses.FINANCIAL_APPROVED,
          orderStatuses.WAREHOUSE_NOTIFIED,
          orderStatuses.WAREHOUSE_PROCESSING,
          orderStatuses.WAREHOUSE_APPROVED,
          orderStatuses.WAREHOUSE_REJECTED
        ].includes(currentStatus as any);
        
      case 'logistics':
        // لجستیک فقط سفارشات تایید شده انبار را می‌بیند
        return [
          orderStatuses.WAREHOUSE_APPROVED,
          orderStatuses.LOGISTICS_ASSIGNED,
          orderStatuses.LOGISTICS_PROCESSING,
          orderStatuses.LOGISTICS_DISPATCHED,
          orderStatuses.LOGISTICS_DELIVERED,
          orderStatuses.COMPLETED
        ].includes(currentStatus as any);
        
      default:
        return false;
    }
  }
  
  // تعیین وضعیت‌های مجاز بعدی برای هر بخش
  getNextValidStatuses(currentStatus: OrderStatus, department: Department): OrderStatus[] {
    switch (department) {
      case 'financial':
        if (currentStatus === orderStatuses.PAYMENT_UPLOADED) {
          return [orderStatuses.FINANCIAL_REVIEWING, orderStatuses.FINANCIAL_REJECTED];
        }
        if (currentStatus === orderStatuses.FINANCIAL_REVIEWING) {
          return [orderStatuses.FINANCIAL_APPROVED, orderStatuses.FINANCIAL_REJECTED];
        }
        break;
        
      case 'warehouse':
        if (currentStatus === orderStatuses.FINANCIAL_APPROVED) {
          return [orderStatuses.WAREHOUSE_NOTIFIED, orderStatuses.WAREHOUSE_PROCESSING];
        }
        if (currentStatus === orderStatuses.WAREHOUSE_PROCESSING) {
          return [orderStatuses.WAREHOUSE_APPROVED, orderStatuses.WAREHOUSE_REJECTED];
        }
        break;
        
      case 'logistics':
        if (currentStatus === orderStatuses.WAREHOUSE_APPROVED) {
          return [orderStatuses.LOGISTICS_ASSIGNED];
        }
        if (currentStatus === orderStatuses.LOGISTICS_ASSIGNED) {
          return [orderStatuses.LOGISTICS_PROCESSING];
        }
        if (currentStatus === orderStatuses.LOGISTICS_PROCESSING) {
          return [orderStatuses.LOGISTICS_DISPATCHED];
        }
        if (currentStatus === orderStatuses.LOGISTICS_DISPATCHED) {
          return [orderStatuses.LOGISTICS_DELIVERED];
        }
        if (currentStatus === orderStatuses.LOGISTICS_DELIVERED) {
          return [orderStatuses.COMPLETED];
        }
        break;
    }
    
    return [];
  }
  
  private async logStatusChange(
    orderManagementId: number,
    fromStatus: OrderStatus | null,
    toStatus: OrderStatus,
    changedBy: number | null,
    department: Department | null,
    notes?: string
  ): Promise<void> {
    await db.insert(orderStatusHistory).values({
      orderManagementId,
      fromStatus,
      toStatus,
      changedBy,
      changedByDepartment: department,
      notes,
    });
  }
  
  async getOrdersByDepartment(department: Department, statuses?: OrderStatus[]): Promise<any[]> {
    let query = db.select({
      // Order Management fields
      id: orderManagement.id,
      customerOrderId: orderManagement.customerOrderId,
      currentStatus: orderManagement.currentStatus,
      deliveryCode: orderManagement.deliveryCode,
      financialReviewerId: orderManagement.financialReviewerId,
      financialReviewedAt: orderManagement.financialReviewedAt,
      financialNotes: orderManagement.financialNotes,
      paymentReceiptUrl: orderManagement.paymentReceiptUrl,
      createdAt: orderManagement.createdAt,
      updatedAt: orderManagement.updatedAt,
      
      // Customer Order fields - مبلغ و کارنسی
      totalAmount: customerOrders.totalAmount,
      currency: customerOrders.currency,
      
      // Customer info
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      customerEmail: customers.email,
      customerPhone: customers.phone,
      
      // Payment Receipt info
      receiptUrl: paymentReceipts.receiptUrl,
      receiptFileName: paymentReceipts.originalFileName,
      receiptMimeType: paymentReceipts.mimeType,
    })
    .from(orderManagement)
    .leftJoin(customerOrders, eq(orderManagement.customerOrderId, customerOrders.id))
    .leftJoin(customers, eq(customerOrders.customerId, customers.id))
    .leftJoin(paymentReceipts, eq(paymentReceipts.customerOrderId, customerOrders.id));
    
    if (department === 'financial') {
      // بخش مالی فقط سفارشات با رسید پرداخت آپلود شده را می‌بیند
      const financialStatuses = statuses || [
        orderStatuses.PAYMENT_UPLOADED,
        orderStatuses.FINANCIAL_REVIEWING
      ];
      query = query.where(inArray(orderManagement.currentStatus, financialStatuses));
    } else if (department === 'warehouse') {
      // انبار فقط سفارشات تایید شده مالی را می‌بیند
      const warehouseStatuses = statuses || [
        orderStatuses.FINANCIAL_APPROVED, // تایید شده توسط مالی
        orderStatuses.WAREHOUSE_NOTIFIED,
        orderStatuses.WAREHOUSE_PROCESSING
      ];
      query = query.where(inArray(orderManagement.currentStatus, warehouseStatuses));
    } else if (department === 'logistics') {
      // لجستیک فقط سفارشات تایید شده انبار را می‌بیند
      const logisticsStatuses = statuses || [
        orderStatuses.WAREHOUSE_APPROVED, // تایید شده توسط انبار
        orderStatuses.LOGISTICS_ASSIGNED,
        orderStatuses.LOGISTICS_PROCESSING,
        orderStatuses.LOGISTICS_DISPATCHED
      ];
      query = query.where(inArray(orderManagement.currentStatus, logisticsStatuses));
    }
    
    const results = await query.orderBy(desc(orderManagement.createdAt));
    
    // Transform results to include customer info and receipt info in nested structure
    return results.map(row => ({
      id: row.id,
      customerOrderId: row.customerOrderId,
      currentStatus: row.currentStatus,
      deliveryCode: row.deliveryCode,
      totalAmount: row.totalAmount,
      currency: row.currency,
      financialReviewerId: row.financialReviewerId,
      financialReviewedAt: row.financialReviewedAt,
      financialNotes: row.financialNotes,
      paymentReceiptUrl: row.paymentReceiptUrl || row.receiptUrl, // Use receipt from payment_receipts if available
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      customer: {
        firstName: row.customerFirstName,
        lastName: row.customerLastName,
        email: row.customerEmail,
        phone: row.customerPhone,
      },
      receipt: row.receiptUrl ? {
        url: row.receiptUrl,
        fileName: row.receiptFileName,
        mimeType: row.receiptMimeType,
      } : null
    }));
  }
  
  async getFinancialPendingOrders(): Promise<OrderManagement[]> {
    return this.getOrdersByDepartment('financial');
  }
  
  async getWarehousePendingOrders(): Promise<OrderManagement[]> {
    return this.getOrdersByDepartment('warehouse');
  }
  
  async getLogisticsPendingOrders(): Promise<OrderManagement[]> {
    return this.getOrdersByDepartment('logistics');
  }
  
  async updateDeliveryInfo(orderId: number, deliveryData: {
    trackingNumber?: string;
    estimatedDeliveryDate?: Date;
    deliveryPersonName?: string;
    deliveryPersonPhone?: string;
    deliveryMethod?: string;
    transportationType?: string;
    postalServiceName?: string;
    postalTrackingCode?: string;
    postalWeight?: string;
    postalPrice?: string;
    postalInsurance?: boolean;
    vehicleType?: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    vehicleColor?: string;
    driverName?: string;
    driverPhone?: string;
    driverLicense?: string;
    deliveryCompanyName?: string;
    deliveryCompanyPhone?: string;
    deliveryCompanyAddress?: string;
  }): Promise<void> {
    const updateData: any = {};
    
    // Basic delivery fields
    if (deliveryData.trackingNumber) updateData.trackingNumber = deliveryData.trackingNumber;
    if (deliveryData.estimatedDeliveryDate) updateData.estimatedDeliveryDate = deliveryData.estimatedDeliveryDate;
    if (deliveryData.deliveryPersonName) updateData.deliveryPersonName = deliveryData.deliveryPersonName;
    if (deliveryData.deliveryPersonPhone) updateData.deliveryPersonPhone = deliveryData.deliveryPersonPhone;
    
    // Delivery method and transportation details
    if (deliveryData.deliveryMethod) updateData.deliveryMethod = deliveryData.deliveryMethod;
    if (deliveryData.transportationType) updateData.transportationType = deliveryData.transportationType;
    
    // Postal service details
    if (deliveryData.postalServiceName) updateData.postalServiceName = deliveryData.postalServiceName;
    if (deliveryData.postalTrackingCode) updateData.postalTrackingCode = deliveryData.postalTrackingCode;
    if (deliveryData.postalWeight) updateData.postalWeight = deliveryData.postalWeight;
    if (deliveryData.postalPrice) updateData.postalPrice = deliveryData.postalPrice;
    if (deliveryData.postalInsurance !== undefined) updateData.postalInsurance = deliveryData.postalInsurance;
    
    // Vehicle details
    if (deliveryData.vehicleType) updateData.vehicleType = deliveryData.vehicleType;
    if (deliveryData.vehiclePlate) updateData.vehiclePlate = deliveryData.vehiclePlate;
    if (deliveryData.vehicleModel) updateData.vehicleModel = deliveryData.vehicleModel;
    if (deliveryData.vehicleColor) updateData.vehicleColor = deliveryData.vehicleColor;
    if (deliveryData.driverName) updateData.driverName = deliveryData.driverName;
    if (deliveryData.driverPhone) updateData.driverPhone = deliveryData.driverPhone;
    if (deliveryData.driverLicense) updateData.driverLicense = deliveryData.driverLicense;
    
    // Delivery company details
    if (deliveryData.deliveryCompanyName) updateData.deliveryCompanyName = deliveryData.deliveryCompanyName;
    if (deliveryData.deliveryCompanyPhone) updateData.deliveryCompanyPhone = deliveryData.deliveryCompanyPhone;
    if (deliveryData.deliveryCompanyAddress) updateData.deliveryCompanyAddress = deliveryData.deliveryCompanyAddress;
    
    if (Object.keys(updateData).length > 0) {
      await db
        .update(orderManagement)
        .set(updateData)
        .where(eq(orderManagement.id, orderId));
    }
  }
  
  async uploadPaymentReceipt(receiptData: InsertPaymentReceipt): Promise<PaymentReceipt> {
    const [receipt] = await db
      .insert(paymentReceipts)
      .values(receiptData)
      .returning();
    return receipt;
  }
  
  async getPaymentReceiptsByOrder(customerOrderId: number): Promise<PaymentReceipt[]> {
    return db
      .select()
      .from(paymentReceipts)
      .where(eq(paymentReceipts.customerOrderId, customerOrderId))
      .orderBy(desc(paymentReceipts.uploadedAt));
  }
  
  async assignUserToDepartment(assignmentData: InsertDepartmentAssignment): Promise<DepartmentAssignment> {
    const [assignment] = await db
      .insert(departmentAssignments)
      .values(assignmentData)
      .returning();
    return assignment;
  }
  
  async getUserDepartments(adminUserId: number): Promise<DepartmentAssignment[]> {
    return db
      .select()
      .from(departmentAssignments)
      .where(and(
        eq(departmentAssignments.adminUserId, adminUserId),
        eq(departmentAssignments.isActive, true)
      ));
  }
  
  async getDepartmentUsers(department: Department): Promise<DepartmentAssignment[]> {
    return db
      .select()
      .from(departmentAssignments)
      .where(and(
        eq(departmentAssignments.department, department),
        eq(departmentAssignments.isActive, true)
      ));
  }
  
  async generateDeliveryCode(orderManagementId: number): Promise<DeliveryCode> {
    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const [deliveryCode] = await db
      .insert(deliveryCodes)
      .values({
        orderManagementId,
        code,
        expiresAt,
      })
      .returning();
    
    return deliveryCode;
  }
  
  async verifyDeliveryCode(code: string, verifiedBy: string): Promise<boolean> {
    const [deliveryCode] = await db
      .select()
      .from(deliveryCodes)
      .where(and(
        eq(deliveryCodes.code, code),
        eq(deliveryCodes.isUsed, false)
      ));
    
    if (!deliveryCode || deliveryCode.expiresAt < new Date()) {
      return false;
    }
    
    // Mark code as used
    await db
      .update(deliveryCodes)
      .set({
        isUsed: true,
        usedAt: new Date(),
        verifiedBy,
      })
      .where(eq(deliveryCodes.id, deliveryCode.id));
    
    return true;
  }
  
  async getDeliveryCodeByOrder(orderManagementId: number): Promise<DeliveryCode | undefined> {
    const [deliveryCode] = await db
      .select()
      .from(deliveryCodes)
      .where(eq(deliveryCodes.orderManagementId, orderManagementId));
    return deliveryCode;
  }
  
  async getOrderStatusHistory(orderManagementId: number): Promise<OrderStatusHistory[]> {
    return db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderManagementId, orderManagementId))
      .orderBy(asc(orderStatusHistory.createdAt));
  }
  
  async getDepartmentStats(department: Department): Promise<{
    pendingCount: number;
    processedToday: number;
    averageProcessingTime: number;
  }> {
    // For now, return mock stats - implement real calculations later
    return {
      pendingCount: 0,
      processedToday: 0,
      averageProcessingTime: 0,
    };
  }
  
  async getOrdersOverview(): Promise<{
    totalOrders: number;
    pendingFinancial: number;
    pendingWarehouse: number;
    pendingLogistics: number;
    completedToday: number;
    cancelledToday: number;
  }> {
    // For now, return mock stats - implement real calculations later
    return {
      totalOrders: 0,
      pendingFinancial: 0,
      pendingWarehouse: 0,
      pendingLogistics: 0,
      completedToday: 0,
      cancelledToday: 0,
    };
  }
}

export const orderManagementStorage = new OrderManagementStorage();