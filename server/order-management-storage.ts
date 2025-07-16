import { 
  orderManagement, 
  orderStatusHistory, 
  departmentAssignments,
  paymentReceipts,
  deliveryCodes,
  shippingRates,
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
  type ShippingRate,
  type InsertShippingRate,
  type OrderStatus,
  type Department,
  orderStatuses
} from "@shared/order-management-schema";
import { customerOrders, customers, orderItems } from "@shared/customer-schema";
import { showcaseProducts as products } from "@shared/showcase-schema";
import { shopProducts } from "@shared/shop-schema";
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
  getOrdersByStatus(status: OrderStatus | OrderStatus[]): Promise<OrderManagement[]>;
  getFinancialPendingOrders(): Promise<OrderManagement[]>;
  getWarehousePendingOrders(): Promise<OrderManagement[]>;
  getLogisticsPendingOrders(): Promise<OrderManagement[]>;
  
  // Delivery information
  updateDeliveryInfo(orderId: number, deliveryData: {
    trackingNumber?: string;
    estimatedDeliveryDate?: string;
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
  }): Promise<OrderManagement>;
  
  // Payment receipts
  uploadPaymentReceipt(receiptData: InsertPaymentReceipt): Promise<PaymentReceipt>;
  getPaymentReceiptsByOrder(customerOrderId: number): Promise<PaymentReceipt[]>;
  
  // Weight calculation
  calculateOrderWeight(customerOrderId: number): Promise<number>;
  
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

  // Get all orders with details for tracking
  getAllOrdersWithDetails(): Promise<any[]>;

  // Shipping rates management
  getShippingRates(filters?: { cityName?: string; isActive?: boolean }): Promise<ShippingRate[]>;
  createShippingRate(rateData: InsertShippingRate): Promise<ShippingRate>;
  updateShippingRate(id: number, updateData: Partial<InsertShippingRate>): Promise<ShippingRate>;
  deleteShippingRate(id: number): Promise<void>;
  getShippingRateByMethod(deliveryMethod: string, city?: string): Promise<ShippingRate | undefined>;
  getAvailableShippingMethods(criteria: {
    city?: string;
    province?: string;
    orderTotal: number;
  }): Promise<ShippingRate[]>;
  calculateShippingCost(criteria: {
    deliveryMethod: string;
    city?: string;
    province?: string;
    orderTotal: number;
    weight: number;
  }): Promise<number>;
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
      
      // Weight and delivery information
      totalWeight: orderManagement.totalWeight,
      weightUnit: orderManagement.weightUnit,
      deliveryMethod: orderManagement.deliveryMethod,
      transportationType: orderManagement.transportationType,
      trackingNumber: orderManagement.trackingNumber,
      estimatedDeliveryDate: orderManagement.estimatedDeliveryDate,
      actualDeliveryDate: orderManagement.actualDeliveryDate,
      deliveryPersonName: orderManagement.deliveryPersonName,
      deliveryPersonPhone: orderManagement.deliveryPersonPhone,
      postalServiceName: orderManagement.postalServiceName,
      postalTrackingCode: orderManagement.postalTrackingCode,
      vehicleType: orderManagement.vehicleType,
      vehiclePlate: orderManagement.vehiclePlate,
      vehicleModel: orderManagement.vehicleModel,
      vehicleColor: orderManagement.vehicleColor,
      driverName: orderManagement.driverName,
      driverPhone: orderManagement.driverPhone,
      deliveryCompanyName: orderManagement.deliveryCompanyName,
      deliveryCompanyPhone: orderManagement.deliveryCompanyPhone,
      
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
      
      // Weight and delivery information
      totalWeight: row.totalWeight,
      weightUnit: row.weightUnit,
      deliveryMethod: row.deliveryMethod,
      transportationType: row.transportationType,
      trackingNumber: row.trackingNumber,
      estimatedDeliveryDate: row.estimatedDeliveryDate,
      actualDeliveryDate: row.actualDeliveryDate,
      deliveryPersonName: row.deliveryPersonName,
      deliveryPersonPhone: row.deliveryPersonPhone,
      postalServiceName: row.postalServiceName,
      postalTrackingCode: row.postalTrackingCode,
      vehicleType: row.vehicleType,
      vehiclePlate: row.vehiclePlate,
      vehicleModel: row.vehicleModel,
      vehicleColor: row.vehicleColor,
      driverName: row.driverName,
      driverPhone: row.driverPhone,
      deliveryCompanyName: row.deliveryCompanyName,
      deliveryCompanyPhone: row.deliveryCompanyPhone,
      
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
  
  async getOrdersByStatus(status: OrderStatus | OrderStatus[]): Promise<OrderManagement[]> {
    const statuses = Array.isArray(status) ? status : [status];
    
    const query = db.select({
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
      
      // Weight and delivery information
      totalWeight: orderManagement.totalWeight,
      weightUnit: orderManagement.weightUnit,
      deliveryMethod: orderManagement.deliveryMethod,
      transportationType: orderManagement.transportationType,
      trackingNumber: orderManagement.trackingNumber,
      estimatedDeliveryDate: orderManagement.estimatedDeliveryDate,
      actualDeliveryDate: orderManagement.actualDeliveryDate,
      deliveryPersonName: orderManagement.deliveryPersonName,
      deliveryPersonPhone: orderManagement.deliveryPersonPhone,
      postalServiceName: orderManagement.postalServiceName,
      postalTrackingCode: orderManagement.postalTrackingCode,
      vehicleType: orderManagement.vehicleType,
      vehiclePlate: orderManagement.vehiclePlate,
      vehicleModel: orderManagement.vehicleModel,
      vehicleColor: orderManagement.vehicleColor,
      driverName: orderManagement.driverName,
      driverPhone: orderManagement.driverPhone,
      deliveryCompanyName: orderManagement.deliveryCompanyName,
      deliveryCompanyPhone: orderManagement.deliveryCompanyPhone,
      
      // Customer Order fields
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
    .leftJoin(paymentReceipts, eq(paymentReceipts.customerOrderId, customerOrders.id))
    .where(inArray(orderManagement.currentStatus, statuses))
    .orderBy(desc(orderManagement.createdAt));
    
    const results = await query;
    
    // Transform results
    return results.map(row => ({
      id: row.id,
      customerOrderId: row.customerOrderId,
      currentStatus: row.currentStatus,
      deliveryCode: row.deliveryCode,
      totalAmount: row.totalAmount,
      currency: row.currency,
      
      // Weight and delivery information
      totalWeight: row.totalWeight,
      weightUnit: row.weightUnit,
      deliveryMethod: row.deliveryMethod,
      transportationType: row.transportationType,
      trackingNumber: row.trackingNumber,
      estimatedDeliveryDate: row.estimatedDeliveryDate,
      actualDeliveryDate: row.actualDeliveryDate,
      deliveryPersonName: row.deliveryPersonName,
      deliveryPersonPhone: row.deliveryPersonPhone,
      postalServiceName: row.postalServiceName,
      postalTrackingCode: row.postalTrackingCode,
      vehicleType: row.vehicleType,
      vehiclePlate: row.vehiclePlate,
      vehicleModel: row.vehicleModel,
      vehicleColor: row.vehicleColor,
      driverName: row.driverName,
      driverPhone: row.driverPhone,
      deliveryCompanyName: row.deliveryCompanyName,
      deliveryCompanyPhone: row.deliveryCompanyPhone,
      
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

  async getLogisticsPendingOrders(): Promise<OrderManagement[]> {
    const orders = await this.getOrdersByDepartment('logistics');
    
    // Calculate total weight for each order if not already calculated
    for (const order of orders) {
      if (!order.totalWeight) {
        await this.calculateAndUpdateOrderWeight(order.customerOrderId);
        // Refresh order data after weight calculation
        const updatedOrders = await this.getOrdersByDepartment('logistics');
        const updatedOrder = updatedOrders.find(o => o.customerOrderId === order.customerOrderId);
        if (updatedOrder) {
          order.totalWeight = updatedOrder.totalWeight;
          order.weightUnit = updatedOrder.weightUnit;
        }
      }
    }
    
    return orders;
  }
  
  async calculateAndUpdateOrderWeight(customerOrderId: number): Promise<void> {
    try {
      // Get all order items for this order
      const orderItemsData = await db
        .select({
          productId: orderItems.productId,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, customerOrderId));
      
      if (orderItemsData.length === 0) {
        return;
      }
      
      let totalWeightKg = 0;
      
      // Calculate total weight from all products in the order
      for (const item of orderItemsData) {
        if (item.productId) {
          // Get product weight from products table
          const productWeight = await db
            .select({
              weight: products.weight,
              weightUnit: products.weightUnit,
            })
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);
          
          if (productWeight.length > 0 && productWeight[0].weight && productWeight[0].weight !== '') {
            const weightValue = productWeight[0].weight;
            const parsedWeight = parseFloat(weightValue);
            
            // Skip if weight is not a valid number
            if (isNaN(parsedWeight) || parsedWeight <= 0) {
              continue;
            }
            
            const weight = parsedWeight;
            const unit = productWeight[0].weightUnit || 'kg';
            const quantity = parseFloat(item.quantity);
            
            // Convert weight to kg if needed
            let weightInKg = weight;
            if (unit === 'g' || unit === 'gram') {
              weightInKg = weight / 1000;
            } else if (unit === 'ton') {
              weightInKg = weight * 1000;
            }
            
            totalWeightKg += weightInKg * quantity;
          }
        }
      }
      
      // Update order management with calculated weight
      if (totalWeightKg > 0) {
        await db
          .update(orderManagement)
          .set({
            totalWeight: totalWeightKg.toFixed(3),
            weightUnit: 'kg',
          })
          .where(eq(orderManagement.customerOrderId, customerOrderId));
      }
    } catch (error) {
      console.error('Error calculating order weight:', error);
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

  // =============================================================================
  // SHIPPING RATES MANAGEMENT
  // =============================================================================

  async getShippingRates(filters?: { cityName?: string; isActive?: boolean }): Promise<ShippingRate[]> {
    let query = db.select().from(shippingRates);

    if (filters) {
      const conditions = [];
      
      if (filters.cityName) {
        conditions.push(eq(shippingRates.cityName, filters.cityName));
      }
      
      if (filters.isActive !== undefined) {
        conditions.push(eq(shippingRates.isActive, filters.isActive));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    return query.orderBy(asc(shippingRates.deliveryMethod), asc(shippingRates.createdAt));
  }

  async createShippingRate(rateData: InsertShippingRate): Promise<ShippingRate> {
    const [newRate] = await db
      .insert(shippingRates)
      .values({
        ...rateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newRate;
  }

  async updateShippingRate(id: number, updateData: Partial<InsertShippingRate>): Promise<ShippingRate> {
    const [updatedRate] = await db
      .update(shippingRates)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(shippingRates.id, id))
      .returning();
    return updatedRate;
  }

  async deleteShippingRate(id: number): Promise<void> {
    await db
      .delete(shippingRates)
      .where(eq(shippingRates.id, id));
  }

  async getShippingRateByMethod(deliveryMethod: string, city?: string): Promise<ShippingRate | undefined> {
    let query = db
      .select()
      .from(shippingRates)
      .where(
        and(
          eq(shippingRates.deliveryMethod, deliveryMethod),
          eq(shippingRates.isActive, true)
        )
      );

    if (city) {
      query = query.where(eq(shippingRates.cityName, city));
    }

    const [rate] = await query.limit(1);
    return rate;
  }

  async getAvailableShippingMethods(criteria: {
    city?: string;
    province?: string;
    orderTotal: number;
  }): Promise<ShippingRate[]> {
    let query = db
      .select()
      .from(shippingRates)
      .where(eq(shippingRates.isActive, true));

    // Filter by city if specified
    if (criteria.city) {
      query = query.where(
        eq(shippingRates.cityName, criteria.city)
      );
    }

    // Filter by province if specified
    if (criteria.province) {
      query = query.where(
        eq(shippingRates.provinceName, criteria.province)
      );
    }

    const availableMethods = await query.orderBy(asc(shippingRates.basePrice));

    // Filter methods that qualify for free shipping
    return availableMethods.filter(method => {
      if (!method.freeShippingThreshold) return true;
      const threshold = parseFloat(method.freeShippingThreshold);
      return criteria.orderTotal < threshold; // Only show if not qualifying for free shipping
    });
  }

  async calculateShippingCost(criteria: {
    deliveryMethod: string;
    city?: string;
    province?: string;
    orderTotal: number;
    weight: number;
  }): Promise<number> {
    // Find matching shipping rate
    let query = db
      .select()
      .from(shippingRates)
      .where(
        and(
          eq(shippingRates.deliveryMethod, criteria.deliveryMethod),
          eq(shippingRates.isActive, true)
        )
      );

    // Add location filters if specified
    if (criteria.city) {
      query = query.where(eq(shippingRates.cityName, criteria.city));
    }
    if (criteria.province) {
      query = query.where(eq(shippingRates.provinceName, criteria.province));
    }

    const [shippingRate] = await query.limit(1);
    
    if (!shippingRate) {
      throw new Error('Shipping method not available for this location');
    }

    // Check for free shipping threshold
    if (shippingRate.freeShippingThreshold) {
      const threshold = parseFloat(shippingRate.freeShippingThreshold);
      if (criteria.orderTotal >= threshold) {
        return 0; // Free shipping
      }
    }

    // Calculate base cost
    let totalCost = parseFloat(shippingRate.basePrice);

    // Add weight-based cost if applicable
    if (shippingRate.pricePerKg && criteria.weight > 0) {
      const weightCost = parseFloat(shippingRate.pricePerKg) * criteria.weight;
      totalCost += weightCost;
    }

    return Math.round(totalCost);
  }

  // Enhanced updateDeliveryInfo method
  async updateDeliveryInfo(orderId: number, deliveryData: {
    trackingNumber?: string;
    estimatedDeliveryDate?: string;
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
  }): Promise<OrderManagement> {
    const updateData: Partial<OrderManagement> = {
      ...deliveryData,
      estimatedDeliveryDate: deliveryData.estimatedDeliveryDate ? new Date(deliveryData.estimatedDeliveryDate) : undefined,
      postalWeight: deliveryData.postalWeight ? deliveryData.postalWeight : undefined,
      postalPrice: deliveryData.postalPrice ? deliveryData.postalPrice : undefined,
      updatedAt: new Date(),
    };

    const [updatedOrder] = await db
      .update(orderManagement)
      .set(updateData)
      .where(eq(orderManagement.id, orderId))
      .returning();

    return updatedOrder;
  }

  // Get all orders with detailed customer information for tracking
  async getAllOrdersWithDetails(): Promise<any[]> {
    try {
      // First get all order management records
      const allOrders = await db
        .select()
        .from(orderManagement)
        .orderBy(desc(orderManagement.createdAt));

      const ordersWithDetails = [];

      for (const order of allOrders) {
        let customerInfo = null;
        
        // Try to get customer info from customer_orders first
        if (order.customerOrderId) {
          try {
            const [customerOrder] = await db
              .select()
              .from(customerOrders)
              .where(eq(customerOrders.id, order.customerOrderId));
            
            if (customerOrder) {
              customerInfo = {
                customerName: customerOrder.customerName,
                customerEmail: customerOrder.customerEmail,
                customerPhone: customerOrder.customerPhone,
              };
            }
          } catch (error) {
            console.log('Error fetching customer order:', error);
          }
        }

        // If no customer info found, use order management data
        if (!customerInfo) {
          customerInfo = {
            customerName: order.customerName || 'نامشخص',
            customerEmail: order.customerEmail || '',
            customerPhone: order.customerPhone || '',
          };
        }

        ordersWithDetails.push({
          ...order,
          ...customerInfo,
        });
      }

      return ordersWithDetails;
    } catch (error) {
      console.error('Error in getAllOrdersWithDetails:', error);
      // Return empty array with proper structure for frontend
      return [];
    }
  }

  async calculateOrderWeight(customerOrderId: number): Promise<number> {
    try {
      // Get order items and join with shop_products to get weight
      const items = await db
        .select({
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          grossWeight: shopProducts.grossWeight,
          netWeight: shopProducts.netWeight,
          weight: shopProducts.weight,
          weightUnit: shopProducts.weightUnit
        })
        .from(orderItems)
        .leftJoin(shopProducts, eq(orderItems.productId, shopProducts.id))
        .where(eq(orderItems.orderId, customerOrderId));

      // Calculate total weight using gross weight (وزن ناخالص) for logistics calculations
      let totalWeight = 0;
      for (const item of items) {
        let productWeight = 0;
        
        // Priority: Use gross weight if available, otherwise fallback to legacy weight
        if (item.grossWeight) {
          productWeight = parseFloat(item.grossWeight.toString());
        } else if (item.weight) {
          productWeight = parseFloat(item.weight.toString());
        }
        
        const quantity = item.quantity || 1;
        totalWeight += productWeight * quantity;
      }

      return Math.round(totalWeight * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error(`Error calculating weight for order ${customerOrderId}:`, error);
      return 0;
    }
  }
}

export const orderManagementStorage = new OrderManagementStorage();