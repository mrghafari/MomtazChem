import {
  pgTable,
  serial,
  text,
  integer,
  decimal,
  timestamp,
  boolean,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Order statuses for different departments
export const orderStatuses = {
  // Initial statuses
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_UPLOADED: 'payment_uploaded',
  
  // Financial department statuses
  FINANCIAL_REVIEWING: 'financial_reviewing',
  FINANCIAL_APPROVED: 'financial_approved',
  FINANCIAL_REJECTED: 'financial_rejected',
  
  // Warehouse department statuses
  WAREHOUSE_NOTIFIED: 'warehouse_notified',
  WAREHOUSE_PROCESSING: 'warehouse_processing',
  WAREHOUSE_APPROVED: 'warehouse_approved',
  WAREHOUSE_REJECTED: 'warehouse_rejected',
  
  // Logistics department statuses
  LOGISTICS_ASSIGNED: 'logistics_assigned',
  LOGISTICS_PROCESSING: 'logistics_processing',
  LOGISTICS_DISPATCHED: 'logistics_dispatched',
  LOGISTICS_DELIVERED: 'logistics_delivered',
  
  // Final statuses
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

// Order management table - extends customer orders with department workflow
export const orderManagement = pgTable("order_management", {
  id: serial("id").primaryKey(),
  customerOrderId: integer("customer_order_id").notNull().unique(),
  
  // Current status and tracking
  currentStatus: varchar("current_status", { length: 50 }).notNull().default(orderStatuses.PENDING_PAYMENT),
  deliveryCode: varchar("delivery_code", { length: 10 }).unique(), // SMS code for delivery verification
  
  // Financial department
  financialReviewerId: integer("financial_reviewer_id"),
  financialReviewedAt: timestamp("financial_reviewed_at"),
  financialNotes: text("financial_notes"),
  paymentReceiptUrl: text("payment_receipt_url"), // Uploaded payment receipt
  
  // Warehouse department
  warehouseAssigneeId: integer("warehouse_assignee_id"),
  warehouseProcessedAt: timestamp("warehouse_processed_at"),
  warehouseNotes: text("warehouse_notes"),
  
  // Logistics department
  logisticsAssigneeId: integer("logistics_assignee_id"),
  logisticsProcessedAt: timestamp("logistics_processed_at"),
  logisticsNotes: text("logistics_notes"),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  deliveryPersonName: text("delivery_person_name"),
  deliveryPersonPhone: text("delivery_person_phone"),
  
  // Delivery method and transportation details
  deliveryMethod: varchar("delivery_method", { length: 50 }).default("courier"), // post, courier, truck, personal_pickup
  transportationType: varchar("transportation_type", { length: 50 }), // motorcycle, car, truck, van
  
  // Postal service details (for post delivery)
  postalServiceName: text("postal_service_name"), // Iran Post, Pishtaz, etc.
  postalTrackingCode: varchar("postal_tracking_code", { length: 100 }),
  postalWeight: decimal("postal_weight", { precision: 8, scale: 2 }),
  postalPrice: decimal("postal_price", { precision: 10, scale: 2 }),
  postalInsurance: boolean("postal_insurance").default(false),
  
  // Vehicle details (for courier/truck delivery)
  vehicleType: varchar("vehicle_type", { length: 50 }), // motorcycle, car, truck, van
  vehiclePlate: varchar("vehicle_plate", { length: 20 }),
  vehicleModel: text("vehicle_model"),
  vehicleColor: text("vehicle_color"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  driverLicense: varchar("driver_license", { length: 50 }),
  
  // Company delivery details
  deliveryCompanyName: text("delivery_company_name"), // Tipax, Mahex, etc.
  deliveryCompanyPhone: text("delivery_company_phone"),
  deliveryCompanyAddress: text("delivery_company_address"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_order_management_status").on(table.currentStatus),
  index("idx_order_management_customer_order").on(table.customerOrderId),
  index("idx_order_management_delivery_code").on(table.deliveryCode),
]);

// Order status history - track all status changes
export const orderStatusHistory = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderManagementId: integer("order_management_id").notNull(),
  fromStatus: varchar("from_status", { length: 50 }),
  toStatus: varchar("to_status", { length: 50 }).notNull(),
  changedBy: integer("changed_by"), // Admin user ID
  changedByDepartment: varchar("changed_by_department", { length: 20 }), // financial, warehouse, logistics
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_order_status_history_order").on(table.orderManagementId),
  index("idx_order_status_history_status").on(table.toStatus),
]);

// Department assignments - which admin users belong to which department
export const departmentAssignments = pgTable("department_assignments", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").notNull(),
  department: varchar("department", { length: 20 }).notNull(), // financial, warehouse, logistics
  isActive: boolean("is_active").default(true),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  assignedBy: integer("assigned_by"), // Admin who made the assignment
}, (table) => [
  index("idx_department_assignments_user").on(table.adminUserId),
  index("idx_department_assignments_dept").on(table.department),
]);

// Payment receipts uploaded by customers
export const paymentReceipts = pgTable("payment_receipts", {
  id: serial("id").primaryKey(),
  customerOrderId: integer("customer_order_id").notNull(),
  customerId: integer("customer_id").notNull(),
  receiptUrl: text("receipt_url").notNull(),
  originalFileName: text("original_file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  notes: text("notes"), // Customer can add notes about the payment
}, (table) => [
  index("idx_payment_receipts_order").on(table.customerOrderId),
  index("idx_payment_receipts_customer").on(table.customerId),
]);

// Delivery verification codes
export const deliveryCodes = pgTable("delivery_codes", {
  id: serial("id").primaryKey(),
  orderManagementId: integer("order_management_id").notNull().unique(),
  code: varchar("code", { length: 6 }).notNull().unique(), // 6-digit SMS code
  isUsed: boolean("is_used").default(false),
  usedAt: timestamp("used_at"),
  verifiedBy: text("verified_by"), // Delivery person name/ID
  expiresAt: timestamp("expires_at").notNull(), // Code expires after 7 days
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_delivery_codes_code").on(table.code),
  index("idx_delivery_codes_order").on(table.orderManagementId),
]);

// Insert schemas
export const insertOrderManagementSchema = createInsertSchema(orderManagement).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderStatusHistorySchema = createInsertSchema(orderStatusHistory).omit({
  id: true,
  createdAt: true,
});

export const insertDepartmentAssignmentSchema = createInsertSchema(departmentAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertPaymentReceiptSchema = createInsertSchema(paymentReceipts).omit({
  id: true,
  uploadedAt: true,
});

export const insertDeliveryCodeSchema = createInsertSchema(deliveryCodes).omit({
  id: true,
  createdAt: true,
});

// Types
export type OrderManagement = typeof orderManagement.$inferSelect;
export type InsertOrderManagement = z.infer<typeof insertOrderManagementSchema>;

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type InsertOrderStatusHistory = z.infer<typeof insertOrderStatusHistorySchema>;

export type DepartmentAssignment = typeof departmentAssignments.$inferSelect;
export type InsertDepartmentAssignment = z.infer<typeof insertDepartmentAssignmentSchema>;

export type PaymentReceipt = typeof paymentReceipts.$inferSelect;
export type InsertPaymentReceipt = z.infer<typeof insertPaymentReceiptSchema>;

export type DeliveryCode = typeof deliveryCodes.$inferSelect;
export type InsertDeliveryCode = z.infer<typeof insertDeliveryCodeSchema>;

// Helper types
export type OrderStatus = typeof orderStatuses[keyof typeof orderStatuses];
export type Department = 'financial' | 'warehouse' | 'logistics';