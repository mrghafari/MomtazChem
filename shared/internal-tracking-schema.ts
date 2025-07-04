import { pgTable, text, serial, timestamp, integer, boolean, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Internal tracking codes for products in workflow
export const internalTrackingCodes = pgTable("internal_tracking_codes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(), // Reference to customer order
  orderItemId: integer("order_item_id").notNull(), // Reference to specific order item
  internalBarcode: varchar("internal_barcode", { length: 20 }).notNull().unique(), // Company internal barcode
  productName: text("product_name").notNull(),
  productSku: text("product_sku"),
  quantity: integer("quantity").notNull(),
  
  // Current location and status
  currentLocation: varchar("current_location", { length: 50 }).notNull().default("warehouse_pending"), // warehouse_pending, warehouse_ready, logistics_assigned, in_transit, delivered
  currentDepartment: varchar("current_department", { length: 20 }).notNull().default("finance"), // finance, warehouse, logistics, delivered
  
  // Department assignments
  assignedToFinance: integer("assigned_to_finance"),
  assignedToWarehouse: integer("assigned_to_warehouse"),
  assignedToLogistics: integer("assigned_to_logistics"),
  
  // Timestamps for tracking
  createdAt: timestamp("created_at").notNull().defaultNow(),
  financeProcessedAt: timestamp("finance_processed_at"),
  warehouseProcessedAt: timestamp("warehouse_processed_at"),
  logisticsProcessedAt: timestamp("logistics_processed_at"),
  deliveredAt: timestamp("delivered_at"),
  
  // Additional tracking info
  warehouseLocation: text("warehouse_location"), // Shelf/bin location in warehouse
  deliveryNote: text("delivery_note"),
  isActive: boolean("is_active").default(true),
});

// Tracking history for internal barcodes
export const trackingHistory = pgTable("tracking_history", {
  id: serial("id").primaryKey(),
  trackingCodeId: integer("tracking_code_id").notNull(),
  internalBarcode: varchar("internal_barcode", { length: 20 }).notNull(),
  
  // Status change details
  fromLocation: varchar("from_location", { length: 50 }),
  toLocation: varchar("to_location", { length: 50 }).notNull(),
  fromDepartment: varchar("from_department", { length: 20 }),
  toDepartment: varchar("to_department", { length: 20 }).notNull(),
  
  // Who made the change
  changedBy: integer("changed_by").notNull(), // Admin/user ID
  changedByName: text("changed_by_name").notNull(),
  department: varchar("department", { length: 20 }).notNull(),
  
  // Additional info
  notes: text("notes"),
  scanLocation: text("scan_location"), // Physical location where scan happened
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Barcode scan logs for audit trail
export const barcodeScanLogs = pgTable("barcode_scan_logs", {
  id: serial("id").primaryKey(),
  internalBarcode: varchar("internal_barcode", { length: 20 }).notNull(),
  scannedBy: integer("scanned_by").notNull(),
  scannedByName: text("scanned_by_name").notNull(),
  department: varchar("department", { length: 20 }).notNull(),
  scanType: varchar("scan_type", { length: 30 }).notNull(), // status_update, location_check, inventory_count, delivery_confirm
  scanLocation: text("scan_location"),
  scanResult: varchar("scan_result", { length: 20 }).notNull().default("success"), // success, error, not_found
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Export schemas
export const insertInternalTrackingCodeSchema = createInsertSchema(internalTrackingCodes).omit({
  id: true,
  createdAt: true,
});

export const insertTrackingHistorySchema = createInsertSchema(trackingHistory).omit({
  id: true,
  createdAt: true,
});

export const insertBarcodeScanLogSchema = createInsertSchema(barcodeScanLogs).omit({
  id: true,
  createdAt: true,
});

// Export types
export type InsertInternalTrackingCode = z.infer<typeof insertInternalTrackingCodeSchema>;
export type InternalTrackingCode = typeof internalTrackingCodes.$inferSelect;

export type InsertTrackingHistory = z.infer<typeof insertTrackingHistorySchema>;
export type TrackingHistory = typeof trackingHistory.$inferSelect;

export type InsertBarcodeScanLog = z.infer<typeof insertBarcodeScanLogSchema>;
export type BarcodeScanLog = typeof barcodeScanLogs.$inferSelect;

// Helper function to generate internal barcode
export function generateInternalBarcode(orderId: number, itemIndex: number): string {
  const orderPart = orderId.toString().padStart(6, '0');
  const itemPart = itemIndex.toString().padStart(2, '0');
  const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `MT${orderPart}${itemPart}${randomPart}`; // MT = Momtaz Tracking
}

// Location constants
export const TRACKING_LOCATIONS = {
  WAREHOUSE_PENDING: 'warehouse_pending',
  WAREHOUSE_READY: 'warehouse_ready',
  LOGISTICS_ASSIGNED: 'logistics_assigned',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  RETURNED: 'returned'
} as const;

export const TRACKING_DEPARTMENTS = {
  FINANCE: 'finance',
  WAREHOUSE: 'warehouse', 
  LOGISTICS: 'logistics',
  DELIVERED: 'delivered'
} as const;

export type TrackingLocation = typeof TRACKING_LOCATIONS[keyof typeof TRACKING_LOCATIONS];
export type TrackingDepartment = typeof TRACKING_DEPARTMENTS[keyof typeof TRACKING_DEPARTMENTS];