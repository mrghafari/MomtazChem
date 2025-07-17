import { pgTable, text, serial, timestamp, decimal, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { showcaseProducts } from "./showcase-schema";

// =============================================================================
// COMPREHENSIVE WAREHOUSE MANAGEMENT SCHEMA
// Based on Excel file structure: کالاها، ورود به انبار، خروج از انبار
// =============================================================================

// Warehouse locations for organizing inventory
export const warehouseLocations = pgTable("warehouse_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // انبار مرکزی، انبار مواد اولیه
  code: text("code").notNull().unique(), // W001, W002
  description: text("description"),
  address: text("address"),
  capacity: decimal("capacity", { precision: 10, scale: 2 }), // ظرفیت
  currentUtilization: decimal("current_utilization", { precision: 5, scale: 2 }).default("0"), // درصد استفاده
  managerId: integer("manager_id"), // مسئول انبار
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Master product definitions (کالاها اصلی)
export const warehouseProducts = pgTable("warehouse_products", {
  id: serial("id").primaryKey(),
  productCode: text("product_code").notNull().unique(), // کد کالا - PT-300 (Paint Thinner PT-300)
  productName: text("product_name").notNull(), // نام کالا - Paint Thinner PT-300
  productType: text("product_type").notNull(), // نوع: محصول نهایی، ماده اولیه، بسته‌بندی
  unit: text("unit").notNull().default("عدد"), // واحد: عدد، لیتر، کیلوگرم
  minStockLevel: integer("min_stock_level").default(0), // حداقل موجودی
  maxStockLevel: integer("max_stock_level"), // حداکثر موجودی
  standardUnitPrice: decimal("standard_unit_price", { precision: 10, scale: 2 }).default("0.00"), // قیمت استاندارد
  category: text("category"), // دسته‌بندی
  subcategory: text("subcategory"), // زیردسته
  specifications: json("specifications"), // مشخصات فنی
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Batch-based inventory items (هر بچ = یک ردیف جداگانه)
export const warehouseItems = pgTable("warehouse_items", {
  id: serial("id").primaryKey(),
  warehouseProductId: integer("warehouse_product_id").notNull().references(() => warehouseProducts.id), // مرجع به محصول اصلی
  batchNumber: text("batch_number").notNull(), // شماره بچ - 1, 2, 100, 102
  batchCode: text("batch_code").notNull().unique(), // کد یکتا = productCode + "-" + batchNumber (PT-300-1, PT-300-2)
  warehouseLocationId: integer("warehouse_location_id").references(() => warehouseLocations.id), // محل انبار
  currentStock: integer("current_stock").default(0), // موجودی فعلی این بچ
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default("0.00"), // قیمت این بچ
  totalValue: decimal("total_value", { precision: 12, scale: 2 }).default("0.00"), // ارزش کل این بچ
  productionDate: timestamp("production_date"), // تاریخ تولید
  expiryDate: timestamp("expiry_date"), // تاریخ انقضا
  supplierName: text("supplier_name"), // تأمین‌کننده این بچ
  supplierCode: text("supplier_code"), // کد تامین‌کننده
  qualityGrade: text("quality_grade"), // درجه کیفیت: A, B, C
  notes: text("notes"), // یادداشت خاص این بچ
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Warehouse receipt entries (ورود به انبار) - هر ورود برای یک بچ خاص
export const warehouseReceipts = pgTable("warehouse_receipts", {
  id: serial("id").primaryKey(),
  receiptNumber: text("receipt_number").notNull().unique(), // شماره رسید - WR-20250701-001
  receiptDate: timestamp("receipt_date").notNull(), // تاریخ ورود
  warehouseProductId: integer("warehouse_product_id").notNull().references(() => warehouseProducts.id), // محصول اصلی
  warehouseItemId: integer("warehouse_item_id").references(() => warehouseItems.id), // بچ خاص (اختیاری، چون ممکن است بچ جدید ایجاد شود)
  batchNumber: text("batch_number").notNull(), // شماره بچ - این ورود برای کدام بچ است
  quantity: integer("quantity").notNull(), // مقدار
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default("0.00"), // قیمت واحد
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default("0.00"), // مبلغ کل
  source: text("source").notNull(), // مرجع: تولید، خرید، انتقال
  supplierName: text("supplier_name"), // تأمین‌کننده/تولید
  supplierCode: text("supplier_code"), // کد تامین‌کننده
  productionDate: timestamp("production_date"), // تاریخ تولید
  expiryDate: timestamp("expiry_date"), // تاریخ انقضا
  qualityControl: boolean("quality_control").default(false), // کنترل کیفیت
  qualityGrade: text("quality_grade"), // درجه کیفیت: A, B, C
  qualityNotes: text("quality_notes"), // یادداشت کیفیت
  registeredBy: text("registered_by").notNull(), // مسئول ثبت
  approvedBy: text("approved_by"), // تأیید شده توسط
  notes: text("notes"), // یادداشت‌ها
  attachments: json("attachments"), // ضمائم (فایل‌ها)
  status: text("status").default("pending"), // وضعیت: pending, approved, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Warehouse issue entries (خروج از انبار) - هر خروج از یک بچ خاص
export const warehouseIssues = pgTable("warehouse_issues", {
  id: serial("id").primaryKey(),
  issueNumber: text("issue_number").notNull().unique(), // شماره حواله - IS-20250701-001
  issueDate: timestamp("issue_date").notNull(), // تاریخ خروج
  warehouseItemId: integer("warehouse_item_id").notNull().references(() => warehouseItems.id), // بچ خاص
  quantity: integer("quantity").notNull(), // مقدار
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default("0.00"), // قیمت واحد
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default("0.00"), // مبلغ کل
  destination: text("destination").notNull(), // مقصد: مشتری، تولید، انتقال، ضایعات
  reference: text("reference").notNull(), // مرجع: فاکتور فروش، درخواست تولید
  customerName: text("customer_name"), // مشتری
  customerCode: text("customer_code"), // کد مشتری
  orderNumber: text("order_number"), // شماره سفارش
  invoiceNumber: text("invoice_number"), // شماره فاکتور
  vehicleInfo: text("vehicle_info"), // اطلاعات حمل‌ونقل
  driverName: text("driver_name"), // نام راننده
  registeredBy: text("registered_by").notNull(), // مسئول ثبت
  approvedBy: text("approved_by"), // تأیید شده توسط
  notes: text("notes"), // یادداشت‌ها
  attachments: json("attachments"), // ضمائم
  status: text("status").default("pending"), // وضعیت: pending, approved, completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Inventory movements for tracking all changes
export const inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  warehouseItemId: integer("warehouse_item_id").notNull().references(() => warehouseItems.id),
  movementType: text("movement_type").notNull(), // in, out, adjustment, transfer
  quantity: integer("quantity").notNull(), // مقدار (مثبت برای ورود، منفی برای خروج)
  previousStock: integer("previous_stock").notNull(), // موجودی قبلی
  newStock: integer("new_stock").notNull(), // موجودی جدید
  referenceId: integer("reference_id"), // ID of receipt or issue
  referenceType: text("reference_type"), // receipt, issue, adjustment
  reason: text("reason"), // دلیل تغییر
  registeredBy: text("registered_by").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Inventory adjustments for stock corrections
export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: serial("id").primaryKey(),
  warehouseItemId: integer("warehouse_item_id").notNull().references(() => warehouseItems.id),
  adjustmentNumber: text("adjustment_number").notNull().unique(), // شماره تعدیل - ADJ-20250701-001
  adjustmentDate: timestamp("adjustment_date").notNull(),
  previousQuantity: integer("previous_quantity").notNull(), // موجودی قبلی
  adjustedQuantity: integer("adjusted_quantity").notNull(), // موجودی جدید
  differenceQuantity: integer("difference_quantity").notNull(), // تفاوت
  adjustmentType: text("adjustment_type").notNull(), // shortage, surplus, damage, expiry
  reason: text("reason").notNull(), // دلیل تعدیل
  costCenter: text("cost_center"), // مرکز هزینه
  registeredBy: text("registered_by").notNull(),
  approvedBy: text("approved_by"),
  notes: text("notes"),
  attachments: json("attachments"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =============================================================================
// ZOD SCHEMAS FOR VALIDATION
// =============================================================================

// Warehouse locations
export const insertWarehouseLocationSchema = createInsertSchema(warehouseLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWarehouseLocation = z.infer<typeof insertWarehouseLocationSchema>;
export type WarehouseLocation = typeof warehouseLocations.$inferSelect;

// Warehouse products (master definitions)
export const insertWarehouseProductSchema = createInsertSchema(warehouseProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWarehouseProduct = z.infer<typeof insertWarehouseProductSchema>;
export type WarehouseProduct = typeof warehouseProducts.$inferSelect;

// Warehouse items
export const insertWarehouseItemSchema = createInsertSchema(warehouseItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWarehouseItem = z.infer<typeof insertWarehouseItemSchema>;
export type WarehouseItem = typeof warehouseItems.$inferSelect;

// Warehouse receipts
export const insertWarehouseReceiptSchema = createInsertSchema(warehouseReceipts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWarehouseReceipt = z.infer<typeof insertWarehouseReceiptSchema>;
export type WarehouseReceipt = typeof warehouseReceipts.$inferSelect;

// Warehouse issues
export const insertWarehouseIssueSchema = createInsertSchema(warehouseIssues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWarehouseIssue = z.infer<typeof insertWarehouseIssueSchema>;
export type WarehouseIssue = typeof warehouseIssues.$inferSelect;

// Inventory movements
export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements).omit({
  id: true,
  createdAt: true,
});
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;

// Inventory adjustments
export const insertInventoryAdjustmentSchema = createInsertSchema(inventoryAdjustments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInventoryAdjustment = z.infer<typeof insertInventoryAdjustmentSchema>;
export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;