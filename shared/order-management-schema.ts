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
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Order statuses for different departments
export const orderStatuses = {
  // Initial statuses
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_GRACE_PERIOD: 'payment_grace_period', // 3-day grace period for bank transfer
  PAYMENT_UPLOADED: 'payment_uploaded',
  
  // Financial department statuses
  FINANCIAL_REVIEWING: 'financial_reviewing',
  FINANCIAL_APPROVED: 'financial_approved',
  FINANCIAL_REJECTED: 'financial_rejected',
  
  // Warehouse department statuses
  WAREHOUSE_PENDING: 'warehouse_pending',
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
  deliveryCode: varchar("delivery_code", { length: 50 }).unique(), // Original order number for delivery verification
  
  // Financial department
  financialReviewerId: integer("financial_reviewer_id"),
  financialReviewedAt: timestamp("financial_reviewed_at"),
  financialNotes: text("financial_notes"),
  paymentReceiptUrl: text("payment_receipt_url"), // Uploaded payment receipt
  
  // Grace period for bank transfer payments
  paymentGracePeriodStart: timestamp("payment_grace_period_start"),
  paymentGracePeriodEnd: timestamp("payment_grace_period_end"),
  isOrderLocked: boolean("is_order_locked").default(false), // Lock order details during grace period
  
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
  
  // Carrier delivery and verification status
  isCarrierDispatched: boolean("is_carrier_dispatched").default(false),
  carrierDispatchedAt: timestamp("carrier_dispatched_at"),
  carrierName: text("carrier_name"),
  carrierPhone: text("carrier_phone"),
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verificationLocation: text("verification_location"),
  
  // Recipient information (can be different from customer)
  recipientName: text("recipient_name"), // نام گیرنده
  recipientPhone: text("recipient_phone"), // شماره موبایل گیرنده
  recipientAddress: text("recipient_address"), // آدرس دریافت کالا
  
  // Carrier location tracking for geography analytics
  carrierLatitude: decimal("carrier_latitude", { precision: 10, scale: 8 }), // GPS latitude coordinates
  carrierLongitude: decimal("carrier_longitude", { precision: 11, scale: 8 }), // GPS longitude coordinates
  carrierLocationAccuracy: decimal("carrier_location_accuracy", { precision: 6, scale: 2 }), // GPS accuracy in meters
  carrierLocationCapturedAt: timestamp("carrier_location_captured_at"), // When location was captured
  carrierLocationSource: varchar("carrier_location_source", { length: 20 }).default("mobile"), // mobile, gps_device, manual
  
  // Delivery method and transportation details
  deliveryMethod: varchar("delivery_method", { length: 50 }).default("courier"), // post, courier, truck, personal_pickup
  transportationType: varchar("transportation_type", { length: 50 }), // motorcycle, car, truck, van
  
  // Total weight calculation for entire order
  totalWeight: decimal("total_weight", { precision: 10, scale: 3 }), // Total weight of all order items in kg
  weightUnit: varchar("weight_unit", { length: 10 }).default("kg"), // kg, ton, gram
  
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

// Shipping rates table - pricing for different delivery methods
export const shippingRates = pgTable("shipping_rates", {
  id: serial("id").primaryKey(),
  deliveryMethod: varchar("delivery_method", { length: 50 }).notNull(), // post, courier, truck, personal_pickup
  transportationType: varchar("transportation_type", { length: 50 }), // motorcycle, car, truck, van
  
  // Geographic coverage
  cityName: text("city_name"), // null means national/all cities
  provinceName: text("province_name"), // null means all provinces
  
  // Weight and size limits
  minWeight: decimal("min_weight", { precision: 8, scale: 2 }).default("0"), // kg
  maxWeight: decimal("max_weight", { precision: 8, scale: 2 }), // kg (null = no limit)
  maxDimensions: text("max_dimensions"), // "length x width x height cm"
  
  // Pricing structure
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(), // Base shipping cost
  pricePerKg: decimal("price_per_kg", { precision: 8, scale: 2 }).default("0"), // Additional cost per kg
  freeShippingThreshold: decimal("free_shipping_threshold", { precision: 10, scale: 2 }), // Order value for free shipping
  
  // Service details
  estimatedDays: integer("estimated_days"), // Delivery time in days
  trackingAvailable: boolean("tracking_available").default(false),
  insuranceAvailable: boolean("insurance_available").default(false),
  insuranceRate: decimal("insurance_rate", { precision: 5, scale: 4 }).default("0"), // % of order value
  
  // Status and management
  isActive: boolean("is_active").default(true),
  smsVerificationEnabled: boolean("sms_verification_enabled").default(true), // SMS verification for delivery
  description: text("description"), // Service description for customers
  internalNotes: text("internal_notes"), // Admin notes
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("shipping_rates_method_idx").on(table.deliveryMethod),
  index("shipping_rates_city_idx").on(table.cityName),
  index("shipping_rates_active_idx").on(table.isActive),
]);

// VAT (Value Added Tax) settings table - for financial management
export const vatSettings = pgTable("vat_settings", {
  id: serial("id").primaryKey(),
  
  // VAT configuration
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("0"), // VAT percentage (e.g., 9.00 for 9%)
  vatEnabled: boolean("vat_enabled").default(false), // Enable/disable VAT calculation
  
  // Product category exemptions
  exemptCategories: json("exempt_categories"), // Array of product categories exempt from VAT
  exemptProductIds: json("exempt_product_ids"), // Array of specific product IDs exempt from VAT
  
  // Geographic settings
  applicableRegions: json("applicable_regions"), // Array of regions where VAT applies
  defaultRegion: text("default_region").default("Iraq"), // Default region for VAT calculation
  
  // Billing and display settings
  vatIncludedInPrice: boolean("vat_included_in_price").default(false), // Whether displayed prices include VAT
  vatDisplayName: text("vat_display_name").default("مالیات بر ارزش افزوده"), // Display name for VAT on invoices
  vatNumber: text("vat_number"), // Company VAT registration number
  
  // Special rules
  shippingTaxable: boolean("shipping_taxable").default(false), // Whether shipping costs are taxable (usually false)
  minimumTaxableAmount: decimal("minimum_taxable_amount", { precision: 10, scale: 2 }), // Minimum order amount for VAT
  
  // Administrative settings
  isActive: boolean("is_active").default(true),
  effectiveDate: timestamp("effective_date").defaultNow(), // When this VAT setting becomes effective
  notes: text("notes"), // Administrative notes about VAT settings
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("vat_settings_active_idx").on(table.isActive),
  index("vat_settings_effective_idx").on(table.effectiveDate),
]);

// Delivery methods table - configurable delivery method types
export const deliveryMethods = pgTable("delivery_methods", {
  id: serial("id").primaryKey(),
  value: varchar("value", { length: 50 }).unique().notNull(), // Unique identifier (e.g., 'cod', 'express')
  label: varchar("label", { length: 100 }).notNull(), // Display name (e.g., 'پس کرایه', 'ارسال اکسپرس')
  icon: varchar("icon", { length: 20 }).default("package"), // Icon name for UI
  color: varchar("color", { length: 20 }).default("blue"), // Color scheme for UI
  
  // Cost fields
  baseCost: decimal("base_cost", { precision: 10, scale: 2 }).default("0"), // Base cost for this delivery method
  costPerKg: decimal("cost_per_kg", { precision: 8, scale: 2 }).default("0"), // Additional cost per kg
  minimumOrder: decimal("minimum_order", { precision: 10, scale: 2 }).default("0"), // Minimum order value for this method
  freeShippingThreshold: decimal("free_shipping_threshold", { precision: 10, scale: 2 }), // Order value for free shipping
  
  // Time and availability
  estimatedDays: integer("estimated_days").default(1), // Delivery time in days
  maxDistance: integer("max_distance"), // Maximum delivery distance in km
  availableAreas: json("available_areas"), // Array of available cities/areas
  
  isActive: boolean("is_active").default(true), // Whether this method is available
  sortOrder: integer("sort_order").default(0), // Display order
  description: text("description"), // Description for customers
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("delivery_methods_value_idx").on(table.value),
  index("delivery_methods_active_idx").on(table.isActive),
  index("delivery_methods_sort_idx").on(table.sortOrder),
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

export const insertShippingRateSchema = createInsertSchema(shippingRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVatSettingSchema = createInsertSchema(vatSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeliveryMethodSchema = createInsertSchema(deliveryMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export type ShippingRate = typeof shippingRates.$inferSelect;
export type InsertShippingRate = z.infer<typeof insertShippingRateSchema>;

export type VatSetting = typeof vatSettings.$inferSelect;
export type InsertVatSetting = z.infer<typeof insertVatSettingSchema>;

export type DeliveryMethod = typeof deliveryMethods.$inferSelect;
export type InsertDeliveryMethod = z.infer<typeof insertDeliveryMethodSchema>;

// Helper types
export type OrderStatus = typeof orderStatuses[keyof typeof orderStatuses];
export type Department = 'financial' | 'warehouse' | 'logistics';